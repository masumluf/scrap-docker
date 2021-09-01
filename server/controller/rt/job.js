const { startBrowser, startPage } = require("../helper/browserHelper");
const { scrollPageToBottom } = require("../helper/core");
const { addData } = require("../authController");
const { sanitizeDate } = require("../helper/dateSanitize");
const Queue = require("better-queue");
let page;
let count = 0;
let q = null;

async function rtnews(io) {
  const browser = await startBrowser();
  page = await startPage(browser);

  await page.goto("https://www.rt.com/news", {
    waitUntil: "networkidle2",
  });
  await scrollPageToBottom(page);
  await page.waitForTimeout(4000);

  async function navigateToNextTab(results) {
    q = new Queue(
      async (data) => {
        if (await addData(data)) {
          count--;
        } else {
          count++;
        }
      },
      { concurrent: results.length },
    );
    for (let result of results) {
      // data storing to db
      q.push(result);
    }
  }

  async function paginate() {
    try {
      const nextClick = await page.$(".button .button__link");
      if (nextClick) {
        console.log("pagination found...");
        await Promise.all([page.click(".button .button__link")]);
        await page.waitForTimeout(4000);
        await scrollPageToBottom(page);
        await page.waitForTimeout(4000);
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
      io.emit("work-process", { data: "Schedule Job Starts..." });
      //console.log(count);
      if (count > 5) {
        await page.close();
        await browser.close();
        io.emit("work-process", { data: null });
        return false;
      }

      io.emit("work-process", { data: "Working..." });
      let results = await page.evaluate(() => {
        return [
          ...document.querySelectorAll(
            ".columns__content:not(:nth-child(5)) .card-rows__content .card",
          ),
        ].map((element) => {
          const article = {
            domain: "rt",
            domain_icon_url: document.querySelector(
              "link[rel='apple-touch-icon']",
            )?.href,
            title: element.querySelector("strong a")?.innerText.trim(),
            content_url: element.querySelector("strong a")?.href,
            topic: "News",
            author_name: "rt.com",
            published_at: Date.now(),
            images_url: element.querySelector("picture img")?.src || "",
            summary: element.querySelector(".card__summary ")?.innerText.trim(),
            body: element.querySelector(".card__summary ")?.innerText.trim(),
            reading_time:
              element.querySelector(".card__summary ")?.innerText.trim()
                .length || 400,
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
        return false;
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
  rtnews,
};
