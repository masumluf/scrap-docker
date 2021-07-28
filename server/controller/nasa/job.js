const { startBrowser, startPage } = require("../helper/browserHelper");
const { scrollPageToBottom } = require("../helper/core");
const { addData } = require("../authController");
const { sanitizeDate } = require("../helper/dateSanitize");
const Queue = require("better-queue");

let page;
let count = 0;
let q = null;

async function nasa(io) {
  let count = 0;
  const browser = await startBrowser();
  page = await startPage(browser);

  await page.goto("https://www.nasa.gov/", {
    waitUntil: "networkidle2",
  });
  await scrollPageToBottom(page);
  await page.waitForTimeout(2000);

  async function navigateToNextTab(results) {
    q = new Queue(
      async (data) => {
        if (await addData(data)) {
          count = 0;
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
          waitUntil: "domcontentloaded",
          timeout: 0,
        });
        await scrollPageToBottom(newTab);
        await page.waitForTimeout(2000);

        console.log("collecting data from next tab..");
        const singleData = await newTab.evaluate(async () => {
          try {
            const regexBody = /(<([^>]+)>)|\n|\t|\s{2,}|"|'/gi;
            const body = document
              .querySelector("section .text")
              ?.innerText.replace(regexBody, " ");
            return {
              body: body?.substring(0, 350),
              summary: body?.substring(0, 150),
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

  async function paginate() {
    try {
      const nextClick = await page.$("#trending");
      if (nextClick) {
        console.log("pagination found...");

        await page.evaluate(() => {
          document.querySelector("#trending").click();
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
    } catch (error) {
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
      console.log(count);
      if (count > 5) {
        await page.close();
        await browser.close();
        io.emit("work-process", { data: null });
        return false;
      }

      console.log("Data collection started");
      let results = await page.evaluate(() => {
        return [...document.querySelectorAll("#cards > a")].map((element) => {
          const article = {
            domain: "nasa",
            domain_icon_url: document.querySelector(
              "link[rel='apple-touch-icon']"
            )?.href,
            title: element
              .querySelector(".headline .lt-line-clamp")
              ?.innerText.trim(),
            content_url: element?.href,
            topic: element.querySelector(".tag a")?.innerText.trim() ?? "News",
            author_name: "nasa",
            published_at: element?.getAttribute("date") || "today",
            images_url:
              "https://www.nasa.gov" +
                element
                  .querySelector(".bg-card-canvas")
                  ?.style?.backgroundImage.split('"')[1] ||
              "https://resize.indiatvnews.com/en/resize/newbucket/1200_-/2020/11/nasa-ap-1604651098.jpg",
            content_type: "article",
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
  nasa,
};
