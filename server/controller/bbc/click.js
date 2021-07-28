const { startBrowser, startPage } = require("../helper/browserHelper");
const { scrollPageToBottom } = require("../helper/core");
const { addData } = require("../authController");
const { sanitizeDate } = require("../helper/dateSanitize");
const { readTime } = require("../helper/readTime");
const Queue = require("better-queue");

let page;
let count = 0;
let q = null;

(async function bbc() {
  let count = 0;
  const browser = await startBrowser();
  page = await startPage(browser);

  await page.goto("https://www.bbc.com/news/world/us_and_canada", {
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
      let newTab;
      try {
        newTab = await startPage(browser);
        await newTab.goto(result.content_url, {
          waitUntil: "domcontentloaded",
          timeout: 3000,
        });
        await scrollPageToBottom(newTab);
        await page.waitForTimeout(2000);

        console.log("collecting data from next tab..");
        const singleData = await newTab.evaluate(async () => {
          try {
            const regexBody = /(<([^>]+)>)|\n|\t|\s{2,}|"|'/gi;
            const body = document.querySelector("main").querySelector("b")
              ?.innerText;
            const published_at = document
              .querySelector("main")
              .querySelector("time")
              .getAttribute("datetime");
            const images_url = document
              .querySelector("main")
              .querySelector("figure img")
              .getAttribute("src");
            const reading_time = document
              .querySelector("main")
              .querySelector("article")?.innerText;
            return {
              body: body?.substring(0, 350),
              summary: body?.substring(0, 150),
              reading_time: reading_time.length,
              published_at,
              images_url,
            };
          } catch (error) {
            console.log(error);
          }
        });

        //result.published_at = sanitizeDate(result.published_at);
        // data storing to db
        q.push({
          ...result,
          ...singleData,
        });
        //console.log({ ...result, ...singleData });
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
      const nextClick = await page.$(".lx-pagination__controls:nth-child(3) a");
      if (nextClick) {
        console.log("pagination found...");
        console.log(count);
        await Promise.all([
          page.click(".lx-pagination__controls:nth-child(3) a"),
        ]);
        await page.waitForTimeout(6000);
        await scrollPageToBottom(page);
        await page.waitForTimeout(6000);
        await collectData();
      } else {
        console.log("Scrapping finished");
        await page.close();
        await browser.close();
        //io.emit("work-process", { data: null });
        return true;
      }
    } catch (error) {
      console.log("Pagination Error Found", error);
      await page.close();
      await browser.close();
      //io.emit("work-process", { data: null });
      return false;
    }
  }

  async function collectData() {
    try {
      const nextClick = await page.$(".lx-pagination__controls:nth-child(3) a");
      if (nextClick) {
        console.log("pagination found...");
        console.log(count);
        await Promise.all([
          page.click(".lx-pagination__controls:nth-child(3) a"),
        ]);
      }
    } catch (e) {
      console.log("error found", e);
      //await collectData();
    }
  }
  console.log("recheck pagination");
  await collectData();
})();
