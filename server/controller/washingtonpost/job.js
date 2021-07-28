const { startBrowser, startPage } = require("../helper/browserHelper");
const { scrollPageToBottom } = require("../helper/core");
const { addData } = require("../authController");
const { sanitizeDate } = require("../helper/dateSanitize");
const Queue = require("better-queue");
let page;
let count = 0;
let q = null;

async function washingtonpost(io) {
  const browser = await startBrowser();
  page = await startPage(browser);

  await page.goto("https://www.washingtonpost.com/world", {
    waitUntil: "networkidle2",
  });
  await scrollPageToBottom(page);
  await page.waitForTimeout(2000);

  async function paginate() {
    try {
      const nextClick = await page.$(".load-more-wrapper > div");
      if (nextClick) {
        console.log("pagination found");
        console.log(count);
        await page.evaluate(() => {
          const clk = document.querySelectorAll(".load-more-wrapper > div");
          clk.forEach((a) => a.click());
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
        return false;
      }
    } catch (e) {
      console.log("Pagination Error Found", e);
      await page.close();
      await browser.close();
      io.emit("work-process", { data: null });
      return false;
    }
  }

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
              .querySelector(".teaser-content")
              ?.innerText.replace(regexBody, " ");
            return {
              published_at:
                document
                  .querySelector(".display-date")
                  ?.innerText.split("at")[0]
                  .trim() || "today",
              reading_time: body?.length || 400,
            };
          } catch (error) {
            console.log(error);
          }
        });

        singleData.published_at = sanitizeDate(singleData.published_at);
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
      io.emit("work-process", { data: "Schedule Job Starts..." });
      console.log(count);
      if (count > 5) {
        await page.close();
        await browser.close();
        io.emit("work-process", { data: null });
        return false;
      }

      console.log("Data collection started");

      let results = await page.evaluate(() => {
        return [
          ...document.querySelectorAll(
            ".chain-content > div > div.border-top-off"
          ),
        ].map((element) => {
          const article = {
            domain: "washingtonpost",
            domain_icon_url:
              "https://www.washingtonpost.com/dr/resources/images/favicon.ico",
            title: element.querySelector("h2")?.innerText,
            content_url: element.querySelector("h2 a")?.href,
            images_url:
              element.querySelector("img")?.currentSrc ||
              "https://www.grinnell.edu/sites/default/files/styles/carousel__image_feature/public/images/2019-11/WashPostStacked%20%282%29_0.jpg?h=0f08a996&itok=xFQ2FcU8",
            topic: element.querySelector(".section")?.innerText || "News",
            author_name:
              element.querySelector(".byline .author")?.innerText.trim() ||
              "washingtonpost",
            summary: element.querySelector(".blurb")?.innerText.trim(),
            body: element.querySelector(".blurb")?.innerText.trim(),
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
      console.log("Data collection Error Found", e);
    }
  }

  console.log("recheck pagination");
  await collectData();
}

module.exports = {
  washingtonpost,
};
