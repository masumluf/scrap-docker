const { startBrowser, startPage } = require("../helper/browserHelper");
const { scrollPageToBottom } = require("../helper/core");
const { addData } = require("../authController");
const { sanitizeDate } = require("../helper/dateSanitize");
const {
  scrapperWithTagCodeTest,
  scrapperWithTagCodeWithOutGetAttributeAndContent,
} = require("../helper/dataScrapper");
const Queue = require("better-queue");

let page;
let count = 0;
let q = null;
let increment = 0;

async function financialPost(io) {
  const browser = await startBrowser();
  page = await startPage(browser);
  //const io = req.app.get("io");

  await page.goto("https://www.thestar.com/news.html", {
    waitUntil: "networkidle2",
  });
  await scrollPageToBottom(page);
  await page.waitForTimeout(2000);

  async function paginate() {
    try {
      const nextClick = await page.$(
        ".pagination__item.pagination__page-num > a",
      );
      if (nextClick) {
        count++;
        console.log("pagination found...");
        console.log(count);
        await Promise.all([
          page.click(".pagination__item.pagination__page-num > a"),
        ]);
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
    // q = new Queue(
    //   async (data) => {
    //     if (await addData(data)) {
    //       count = 0;
    //     } else {
    //       count++;
    //     }
    //   },
    //   { concurrent: results.length },
    // );

    for (let result of results) {
      increment++;
      setTimeout(async () => {
        await scrapperWithTagCodeWithOutGetAttributeAndContent(result);
      }, increment * 2000);
    }
    await paginate();
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
        return [...document.querySelectorAll(".c-mediacard")].map((element) => {
          const article = {
            domain: "huffpost",
            domain_icon_url: document.querySelector(
              "link[rel='apple-touch-icon']",
            )?.href,
            titleTag: "title",
            bodyTag: ".entry__text",

            topicTag: ".breadcrumbs__item-link",
            content_url: element.querySelector(
              ".card__headline.card__headline--long",
            )?.href,
            tagTag: ".tag-cloud",
            authorTag: ".author-card__link.yr-author-name",

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
      //await paginate();
    } catch (e) {
      console.log("error found", e);
      await collectData();
    }
  }

  await collectData();
  await page.close();
  await browser.close();
}

module.exports = {
  financialPost,
};
