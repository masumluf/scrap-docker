const { startBrowser, startPage } = require("../helper/browserHelper");
const { scrollPageToBottom } = require("../helper/core");
const { addData } = require("../authController");
const { sanitizeDate } = require("../helper/dateSanitize");
const {
  scrapperWithTagCodeTest,
  scrapperWithTagCodeWithOutGetAttributeTopic,
} = require("../helper/dataScrapper");
const Queue = require("better-queue");

let page;
let count = 0;
let q = null;
let increment = 0;

async function citynews(io) {
  const browser = await startBrowser();
  page = await startPage(browser);
  //const io = req.app.get("io");

  await page.goto("https://toronto.citynews.ca/", {
    waitUntil: "networkidle2",
  });
  await scrollPageToBottom(page);
  await page.waitForTimeout(2000);

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
        await scrapperWithTagCodeWithOutGetAttributeTopic(result);
      }, increment * 2000);
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
        return [...document.querySelectorAll(".post")].map((element) => ({
          domain: "citynews",
          domain_icon_url: document.querySelector(
            "link[rel='apple-touch-icon']",
          )?.href,
          titleTag: "title",
          bodyTag: "meta[name='description']",
          readingTag: ".col-lg-16.col-md-16.col-sm-16",
          topicTag: "meta[property='article:tag']",
          content_url: element?.querySelector("a")?.href,
          tagTag: "meta[property='article:tag']",
          images_url_tag: "meta[property='og:image']",
          content_type: "news",
        }));
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
  citynews,
};
