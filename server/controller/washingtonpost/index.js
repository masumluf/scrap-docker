const { startBrowser, startPage } = require("../helper/browserHelper");
const { scrollPageToBottom } = require("../helper/core");
const { addData } = require("../authController");
const { sanitizeDate } = require("../helper/dateSanitize");
const Queue = require("better-queue");
let page;

async function washingtonpost(req, res) {
  let count = 0;
  const browser = await startBrowser();
  page = await startPage(browser);
  const io = req.app.get("io");

  await page.goto("https://www.washingtonpost.com/world", { waitUntil: "networkidle2" });
  await scrollPageToBottom(page);
  await page.waitForTimeout(2000);

  async function paginate() {
    try {
      const nextClick = await page.$(".load-more-wrapper > div");
      if (nextClick) {
        count++;
        console.log("pagination found");
        console.log(count);
        await page.evaluate(() => {
          const clk = document.querySelectorAll(".load-more-wrapper > div")
          clk.forEach(a => a.click());
        });
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
          waitUntil: "networkidle2"
        });

        console.log("collecting data from next tab..");
        const singleData = await newTab.evaluate(async () => {
          try {
            const regexBody = /(<([^>]+)>)|\n|\t|\s{2,}|"|'/ig;
            const body = document.querySelector(".teaser-content")?.innerText.replace(regexBody, " ");
            return {
              published_at: document.querySelector(".display-date")?.innerText.split("at")[0].trim() || "today",
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

  async function collectData() {
    try {
      console.log("Data collection started");

      let results = await page.evaluate(() => {
        return [...document.querySelectorAll(".chain-content > div > div.border-top-off")].map(
          (element) => {
            const article = {
              domain: "washingtonpost",
              domain_icon_url: "https://www.washingtonpost.com/dr/resources/images/favicon.ico",
              title: element.querySelector("h2")?.innerText,
              content_url: element.querySelector("h2 a")?.href,
              images_url: element.querySelector("img")?.currentSrc || "",
              topic: element.querySelector(".section")?.innerText || "News",
              author_name: element.querySelector(".byline .author")?.innerText.trim() || "washingtonpost",
              summary: element.querySelector(".blurb")?.innerText.trim(),
              body: element.querySelector(".blurb")?.innerText.trim(),
              content_type: "news",
            };
            element.remove();
            return article;
          },
        );
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
      console.log("Data collection Error Found", e);
    }
  }

  console.log("recheck pagination");
  await collectData();
}

module.exports = {
  washingtonpost
};
