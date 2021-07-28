const { startBrowser, startPage } = require("../helper/browserHelper");
const { scrollPageToBottom } = require("../helper/core");
const { addData } = require("../authController");
const { sanitizeDate } = require("../helper/dateSanitize");
const Queue = require("better-queue");
let page;

async function reuters(req, res) {
  let count = 0;
  const browser = await startBrowser();
  page = await startPage(browser);
  const io = req.app.get("io");

  await page.goto("https://www.reuters.com/world", {
    waitUntil: "networkidle2",
  });
  await scrollPageToBottom(page);
  await page.waitForTimeout(2000);

  async function navigateToNextTab(results) {
    const q = new Queue(
      async (data) => {
        await addData(data);
      },
      { concurrent: results.length }
    );

    for (let result of results) {
      let newTab;
      try {
        newTab = await startPage(browser);
        await newTab.goto(result.content_url, {
          waitUntil: "domcontentloaded",
          timeout: 0,
        });
        await scrollPageToBottom(newTab);
        await newTab.waitForTimeout(2000);

        console.log("collecting data from next tab..");
        const singleData = await newTab.evaluate(async () => {
          try {
            const regexBody = /(<([^>]+)>)|\n|\t|\s{2,}|"|'/ig;
            const body = document.querySelector(".paywall-article")?.innerText.replace(regexBody, " ");
            return {
              author_name:
                document.querySelector(".ArticleHeader__author___Q1-tGb")?.innerText ?? "reuters",
              published_at: document.querySelector("time span")?.innerText,
              summary: document.querySelector(".paywall-article p")?.innerText,
              body: body?.substring(0,350),
              reading_time: body?.length || 400,
            };
          } catch (error) {
            console.log(error);
          }
        });

        singleData.published_at = sanitizeDate(singleData.published_at);
        // data storing to db
        q.push({
          ...result,
          ...singleData,
        });
        await newTab.waitForTimeout(2000);
        await newTab.close();
      } catch (error) {
        await newTab.close();
        console.log("navigation error", error);
      }
    }
  }

  async function paginate() {
    try {
      const nextClick = await page.$(".Topic__loadmore___3juLCQ button");
      if (nextClick) {
        count++;
        console.log("pagination found...");
        console.log(count);
        await Promise.all([page.click(".Topic__loadmore___3juLCQ button")]);
        await page.waitForTimeout(2000);
        await scrollPageToBottom(page);
        await page.waitForTimeout(2000);
        await collectData();
      } else {
        console.log("Scrapping finished");
        await page.close();
        await browser.close();
        io.emit("work-process", { data: null });
        return res.status(422).json(false);
      }
    } catch (e) {
      console.log("Pagination Error Found", e);
      await page.close();
      await browser.close();
      io.emit("work-process", { data: null });
      return res.status(422).json(false);
    }
  }

  async function collectData() {
    try {
      io.emit("work-process", { data: "Working..." });
      console.log("Data collection started");
      let results = await page.evaluate(() => {
        return [...document.querySelectorAll(".story-card")].map((element) => {
          const article = {
            domain: "reuters",
            domain_icon_url: document.querySelector("link[rel='shortcut icon']")?.href,
            title:
              element.querySelector("h6 span:nth-child(2)")?.innerText ??
              element.querySelector("h3 span:nth-child(2)")?.innerText,
            content_url: element?.href,
            topic:
              element.querySelector("h6 span")?.innerText ??
              element.querySelector("h3 span")?.innerText.split("·")[0].trim(),
            images_url: document.querySelector("img")?.src ?? "",
            content_type: "news",
          };
          element.remove();
          return article;
        });
      });
      if (results.length === 0) {
        console.log("Scrapping finished");
        await page.close();
        await browser.close();
        io.emit("work-process", { data: null });
        return res.status(422).json(false);
      }

      await navigateToNextTab(results);
      await paginate();
    } catch (e) {
      console.log("error found", e);
      await collectData();
    }
  }
  console.log("recheck pagination");
  await collectData();
}

module.exports = {
  reuters,
};
