const { startBrowser, startPage } = require("../helper/browserHelper");
const { scrollPageToBottom } = require("../helper/core");
const { addData } = require("../authController");
const { sanitizeDate } = require("../helper/dateSanitize");
const Queue = require("better-queue");
let page;

async function revealnewsOld(req, res) {
  let { topicName } = req.body;
  let count = 0;

  const browser = await startBrowser();
  page = await startPage(browser);
  const io = req.app.get("io");

  await page.goto("https://revealnews.org/topic/inequality", {
    waitUntil: "networkidle2",
  });
  await scrollPageToBottom(page);
  await page.waitForTimeout(2000);

  async function paginate() {
    try {
      const nextClick = await page.$(".next");
      if (nextClick) {
        count++;
        console.log("pagination found...");
        console.log(count);
        await page.evaluate(() => {
          document.querySelector(".next").click();
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
        await newTab.goto(result.content_url, { waitUntil: "networkidle2" });

        console.log("collecting data from next tab..");
        const singleData = await newTab.evaluate(async () => {
          try {
            return {
              reading_time: document.querySelector(".entry-content")?.innerText?.length || 400,
            };
          } catch (error) {
            console.log(error);
          }
        });

        result.published_at = sanitizeDate(result.published_at);
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
      io.emit("work-process", { data: "Working..." });
      let results = await page.evaluate(() => {
        return [...document.querySelectorAll("main article")].map((element) => {
          return {
            domain: "revealnews",
            domain_icon_url: document.querySelector("link[rel='apple-touch-icon']")?.href,
            title: element.querySelector("h2")?.innerText,
            content_url: element.querySelector("h2 a")?.href,
            images_url: element.querySelector("figure amp-img")?.getAttribute("src"),
            topic: element.querySelector(".cat-links a")?.innerText,
            author_name: element.querySelector(".byline")?.innerText.split("by")[1].trim() ??
              "revealnews",
            published_at: element.querySelector(".posted-on time.published")?.innerText,
            summary: element.querySelector(".entry-content")?.innerText,
            body: element.querySelector(".entry-content")?.innerText,
            content_type: "news",
          };
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
  revealnewsOld,
};
