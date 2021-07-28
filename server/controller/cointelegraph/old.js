const { startBrowser, startPage } = require("../helper/browserHelper");
const { scrollPageToBottom } = require("../helper/core");
const { addData } = require("../authController");
const { sanitizeDate } = require("../helper/dateSanitize");
const Queue = require("better-queue");
let page;

async function cointelegraphOld(req, res) {
  let { topicName } = req.body;
  let count = 0;

  const browser = await startBrowser();
  page = await startPage(browser);
  const io = req.app.get("io");

  await page.goto(`https://cointelegraph.com/tags/${topicName}`, { waitUntil: "domcontentloaded" });
  await scrollPageToBottom(page);
  await page.waitForTimeout(2000);

  async function paginate() {
    try {
      const nextClick = await page.$("button.posts-listing__more-btn");
      if (nextClick) {
        count++;
        console.log("pagination found...");
        console.log(count);
        await Promise.all([page.click("button.posts-listing__more-btn")]);
        await page.waitForTimeout(2000);
        await scrollPageToBottom(page);
        await page.waitForTimeout(2000);
        await collectData();
      }
      else {
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
          waitUntil: "domcontentloaded",
          timeout: 0,
        });

        console.log("collecting data from next tab..");
        const singleData = await newTab.evaluate(async () => {
          try {
            const regexBody = /(<([^>]+)>)|\n|\t|\s{2,}|"|'/ig;
            const body = document.querySelector(".post-content")?.innerText.replace(regexBody, " ");
            return {
              reading_time: body?.length || 400,
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
      let results = await page.evaluate(() => {
        return [
          ...document.querySelectorAll("ul li article")
        ].map((element) => {
          const article = {
            domain: "cointelegraph",
            domain_icon_url: document.querySelector("link[rel='shortcut icon']")?.href,
            title: element.querySelector("a.post-card-inline__title-link")?.innerText,
            content_url: element.querySelector("a.post-card-inline__title-link")?.href,
            images_url: element.querySelector("figure img")?.src ?? "",
            topic: element.querySelector("figure > span")?.innerText,
            author_name: element.querySelector("p.post-card-inline__author a")?.innerText.trim() || "cointelegraph",
            published_at: element.querySelector("time.post-card-inline__date")?.dateTime || "today",
            summary: element.querySelector("p.post-card-inline__text")?.innerText,
            body: element.querySelector("p.post-card-inline__text")?.innerText,
            content_type: "article"
          }
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
  cointelegraphOld,
};
