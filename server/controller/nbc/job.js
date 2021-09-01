const { startBrowser, startPage } = require("../helper/browserHelper");
const { scrollPageToBottom } = require("../helper/core");
const { addData } = require("../authController");
const { sanitizeDate } = require("../helper/dateSanitize");
const Queue = require("better-queue");
let page;
let count = 0;
let q = null;

async function nbcnews(io) {
  const browser = await startBrowser();
  page = await startPage(browser);

  await page.goto("https://www.nbcnews.com/us-news", {
    waitUntil: "networkidle2",
  });
  await scrollPageToBottom(page);
  await page.waitForTimeout(2000);

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
      const nextClick = await page.$(".feeds__load-more-button");
      if (nextClick) {
        console.log("pagination found...");
        await Promise.all([page.click(".feeds__load-more-button")]);
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
        return [...document.querySelectorAll(".wide-tease-item__wrapper")].map(
          (element) => {
            const article = {
              domain: "nbcnews",
              domain_icon_url: document.querySelector("link[rel='icon']")?.href,
              title: element.querySelector(".wide-tease-item__headline")
                ?.innerText,
              content_url: element.querySelector(".wide-tease-item__headline")
                ?.parentElement?.href,
              topic: element.querySelector(".articleTitleSection")?.innerText,
              author_name: "nbcnews",
              body: element.querySelector(".wide-tease-item__description")
                ?.innerText,
              images_url: element.querySelector(".wide-tease-item__image > img")
                ?.src,
              published_at: Date.now(),
              content_type: "news",
              reading_time: body?.length || 400,
              summary: element.querySelector(".wide-tease-item__description")
                ?.innerText,
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
  nbcnews,
};
