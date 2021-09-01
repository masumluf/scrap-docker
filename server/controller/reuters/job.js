const { startBrowser, startPage } = require("../helper/browserHelper");
const { scrollPageToBottom } = require("../helper/core");
const { addData } = require("../authController");
const { sanitizeDate } = require("../helper/dateSanitize");
const Queue = require("better-queue");
let page;
let count = 0;
let q = null;

async function recutersnews(io) {
  const browser = await startBrowser();
  page = await startPage(browser);

  await page.goto("https://www.reuters.com/world", {
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
      const nextClick = await page.$(".Topic__loadmore___3juLCQ button");
      if (nextClick) {
        console.log("pagination found...");
        await Promise.all([page.click(".Topic__loadmore___3juLCQ button")]);
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
        return [...document.querySelectorAll(".story-card")].map((element) => {
          const article = {
            domain: "reuters",
            domain_icon_url: document.querySelector("link[rel='shortcut icon']")
              ?.href,
            title: element.querySelector("h6")?.innerText,
            content_url: element?.href,
            body: element.querySelector("h6")?.innerText,
            summary: element.querySelector("h6")?.innerText,
            topic: element
              .querySelector(".MediaStoryCard__section___QP6_rl")
              ?.innerText.split("·")[0],
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
  recutersnews,
};
