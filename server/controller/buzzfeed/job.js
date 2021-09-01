const { startBrowser, startPage } = require("../helper/browserHelper");
const { scrollPageToBottom } = require("../helper/core");
const { addData } = require("../authController");
const { sanitizeDate } = require("../helper/dateSanitize");
const Queue = require("better-queue");
let page;
let count = 0;
let q = null;

async function buzzfeed(io) {
  const browser = await startBrowser();
  page = await startPage(browser);

  await page.goto("https://www.buzzfeednews.com/", {
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
      const nextClick = await page.$(".button-primary.button--full-width");
      if (nextClick) {
        console.log("pagination found...");
        await Promise.all([page.click(".button-primary.button--full-width")]);
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
        return [...document.querySelectorAll(".article")].map((element) => {
          const article = {
            domain: "buzzfeed",
            domain_icon_url: document.querySelector("link[rel='icon']")?.href,
            title: element.querySelector("h2")?.innerText,
            content_url: element.querySelector("h2 a")?.href,
            author_name: element
              .querySelector(".newsblock-story-card__byline")
              ?.innerText.trim(),
            body: element.querySelector(".newsblock-story-card__description")
              ?.innerText,
            images_url: element.querySelector(
              ".newsblock-story-card__image.img-wireframe__image",
            )?.src,
            published_at: Date.now(),
            content_type: "article",
            summary: element.querySelector(".newsblock-story-card__description")
              ?.innerText,
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
  buzzfeed,
};
