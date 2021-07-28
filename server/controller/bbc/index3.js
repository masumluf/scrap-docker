const { startBrowser, startPage } = require("../helper/browserHelper");
const { scrollPageToBottom } = require("../helper/core");
const { addData } = require("../authController");
const { sanitizeDate } = require("../helper/dateSanitize");
const { readTime } = require("../helper/readTime");
const Queue = require("better-queue");

let page;

async function bbc(req, res) {
  let count = 0;
  const browser = await startBrowser();
  page = await startPage(browser);
  const io = req.app.get("io");

  await page.goto("https://www.bbc.com/news/world/us_and_canada", {
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
        await page.waitForTimeout(2000);

        console.log("collecting data from next tab..");
        const singleData = await newTab.evaluate(async () => {
          try {
            const regexBody = /(<([^>]+)>)|\n|\t|\s{2,}|"|'/gi;
            const body = document.querySelector("main").querySelector("b")
              ?.innerText;
            const published_at = document
              .querySelector("main")
              .querySelector("time")
              .getAttribute("datetime");
            const images_url = document
              .querySelector("main")
              .querySelector("figure img")
              .getAttribute("src");
            const reading_time = document
              .querySelector("main")
              .querySelector("article")?.innerText;
            return {
              body: body?.substring(0, 350),
              summary: body?.substring(0, 150),
              reading_time,
              published_at,
              images_url,
            };
          } catch (error) {
            console.log(error);
          }
        });

        //result.published_at = sanitizeDate(result.published_at);
        // data storing to db
        // q.push({
        //   ...result,
        //   ...singleData,
        // });
        console.log({ ...result, ...singleData });
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
      const nextClick = await page.$(".lx-pagination__controls--right a");
      if (nextClick) {
        count++;
        console.log("pagination found...");
        console.log(count);
        await page.evaluate(() => {
          document.querySelector(".lx-pagination__controls--right a").click();
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
    } catch (error) {
      console.log("Pagination Error Found", e);
      await page.close();
      await browser.close();
      io.emit("work-process", { data: null });
      return res.status(422).json(false);
    }
  }

  async function collectData() {
    try {
      console.log("Data collection started");
      let results = await page.evaluate(() => {
        return [...document.querySelectorAll("ol li")]
          .filter((item) => item.className === "lx-stream__post-container")
          .map((element) => {
            const article = {
              domain: "bbc",
              domain_icon_url: document.querySelector(
                "link[rel='apple-touch-icon']"
              )?.href,
              title: element
                .querySelector(".lx-stream-post__header-text")
                ?.innerText.trim(),
              content_url: element.querySelector(".qa-heading-link")?.href,
              topic: "US and Canada",
              author_name: "bbc",
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
  bbc,
};
