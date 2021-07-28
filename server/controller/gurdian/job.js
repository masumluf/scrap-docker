const { startBrowser, startPage } = require("../helper/browserHelper");
const { scrollPageToBottom } = require("../helper/core");
const { addData } = require("../authController");
const { sanitizeDate } = require("../helper/dateSanitize");
const Queue = require("better-queue");
let page;
let count = 0;
let q = null;

async function gurdian(io) {
  const browser = await startBrowser();
  page = await startPage(browser);

  await page.goto("https://www.theguardian.com/us-news/all", {
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
      { concurrent: results.length }
    );
    for (let result of results) {
      const newTab = await startPage(browser);
      await newTab.goto(result.content_url, {
        waitUntil: "domcontentloaded",
        timeout: 0,
      });

      console.log("collecting data from next tab..");
      const singleData = await newTab.evaluate(async () => {
        try {
          const regexBody = /(<([^>]+)>)|\n|\t|\s{2,}|"|'/gi;
          const body = document.querySelector(
            ".article-body-commercial-selector.article-body-viewer-selector.dcr-bjn8wh"
          )?.textContent;
          return {
            topic:
              document.querySelector(".dcr-1u8qly9 a span")?.innerText ?? "US",
            // published_at:
            //   document.querySelector("label.dcr-hn0k3p")?.textContent ||
            //   "today",
            reading_time: body?.length || 400,
            body: body?.substring(0, 400),
            summary: body?.substring(0, 200),
            images_url:
              document.querySelector(".dcr-1989ovb")?.src ||
              "https://assets.guim.co.uk/images/eada8aa27c12fe2d5afa3a89d3fbae0d/fallback-logo.png",
          };
        } catch (error) {
          console.log(error);
        }
      });

      // result.published_at = sanitizeDate(Date.now());
      // data storing to db
      q.push({
        ...result,
        ...singleData,
      });

      //console.log({ ...result, ...singleData });

      await newTab.waitForTimeout(2000);
      await newTab.close();
    }
  }

  async function paginate() {
    try {
      const nextClick = await page.$(".pagination__list .is-active")
        .nextElementSibling;
      if (nextClick) {
        console.log("pagination found...");

        await Promise.all([
          page.click(".pagination__list .is-active").nextElementSibling,
        ]);
      }

      await scrollPageToBottom(page);
      await page.waitForTimeout(2000);
      await collectData();
    } catch (e) {
      console.log("Pagination Error Found", e);
      await page.close();
      await browser.close();
      io.emit("work-process", { data: null });
      return false;
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
        return [...document.querySelectorAll(".fc-item__container")].map(
          (element) => {
            const article = {
              domain: "gurdian",
              domain_icon_url: document.querySelector(
                "link[rel='apple-touch-icon']"
              )?.href,
              title: element.querySelector(".fc-item__content a")?.innerText,
              content_url: element.querySelector(".fc-item__content a")?.href,
              content_type: "news",
            };
            element.remove();
            return article;
          }
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
  gurdian,
};
