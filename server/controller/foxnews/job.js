const { startBrowser, startPage } = require("../helper/browserHelper");
const { scrollPageToBottom } = require("../helper/core");
const { addData } = require("../authController");
const { sanitizeDate } = require("../helper/dateSanitize");
const Queue = require("better-queue");
let page;
let count = 0;
let q = null;

async function foxnews(io) {
  const browser = await startBrowser();
  page = await startPage(browser);
  //const io = req.app.get("io");

  await page.goto("https://www.foxnews.com/us", { waitUntil: "networkidle2" });
  await scrollPageToBottom(page);
  await page.waitForTimeout(2000);

  async function paginate() {
    try {
      const nextClick = await page.$(".load-more a");
      if (nextClick) {
        console.log("pagination found");

        await page.evaluate(() => {
          document.querySelector(".load-more a").click();
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
    q = new Queue(
      async (data) => {
        if (await addData(data)) {
          count = 0;
        } else {
          count++;
        }
      },
      { concurrent: results.length }
    );

    for (let result of results) {
      let newTab;
      try {
        newTab = await startPage(browser);
        await newTab.goto(result.content_url, {
          waitUntil: "networkidle2",
        });

        console.log("collecting data from next tab..");
        const singleData = await newTab.evaluate(async () => {
          try {
            const regexBody = /(<([^>]+)>)|\n|\t|\s{2,}|"|'/gi;
            const body = document
              .querySelector(".article-body")
              ?.innerText.replace(regexBody, " ");
            return {
              author_name:
                document.querySelector(".author-byline a")?.innerText ||
                "foxnews",
              body: body?.substring(0, 350),
              summary: body?.substring(0, 150),
              reading_time: body?.length || 400,
            };
          } catch (error) {
            console.log(error);
          }
        });

        result.published_at = sanitizeDate(result.published_at);
        // data storing to db
        q.push({
          ...singleData,
          ...result,
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

      io.emit("work-process", { data: "Schedule Job Starts..." });
      if (count > 5) {
        await page.close();
        await browser.close();
        io.emit("work-process", { data: null });
        console.log("Finished..");
        return false;
      }

      let results = await page.evaluate(() => {
        return [
          ...document.querySelectorAll(".collection-article-list article"),
        ].map((element) => {
          const article = {
            domain: "foxnews",
            domain_icon_url: document.querySelector("link[rel='icon']")?.href,
            title: element.querySelector("h4")?.innerText,
            content_url: element.querySelector("h4 a")?.href,
            images_url:
              element.querySelector("img")?.src ||
              "https://pbs.twimg.com/profile_images/918480715158716419/4X8oCbge_400x400.jpg",
            topic:
              element.querySelector(".info-header .eyebrow")?.innerText ||
              "News",
            published_at: element.querySelector(".time")?.innerText || "today",
            summary: element.querySelector(".dek")?.innerText,
            body: element.querySelector(".dek")?.innerText,
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
      console.log("Data collection Error Found", e);
    }
  }

  console.log("recheck pagination");
  await collectData();
}

module.exports = {
  foxnews,
};
