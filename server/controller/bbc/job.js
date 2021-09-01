const { startBrowser, startPage } = require("../helper/browserHelper");
const { scrollPageToBottom } = require("../helper/core");
const { addData } = require("../authController");
const { sanitizeDate } = require("../helper/dateSanitize");
const Queue = require("better-queue");
let page;
let count = 0;
let q = null;

async function bbc(io) {
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
          count = 0;
        } else {
          count++;
        }
      },
      { concurrent: results.length },
    );
    for (let result of results) {
      let newTab;
      try {
        newTab = await startPage(browser);
        await newTab.goto(result.content_url, {
          waitUntil: "networkidle2",
        });
        await scrollPageToBottom(newTab);
        await newTab.waitForTimeout(2000);
        //await newTab.screenshot({ path: "example.png" });
        console.log("collecting data from next tab..");
        const singleData = await newTab.evaluate(async () => {
          try {
            const regexBody = /(<([^>]+)>)|\n|\t|\s{2,}|"|'/gi;

            //console.log(result.content_url);
            let tag = [
              ...new Set(
                [
                  ...document.querySelectorAll(
                    ".ssrcss-d7aixc-ClusterItems.e1ihwmse0 li a",
                  ),
                ].map((item) => item.innerText),
              ),
            ];

            const bodyText = [
              ...document.querySelectorAll(
                ".ssrcss-uf6wea-RichTextComponentWrapper",
              ),
            ].map((item) => item?.innerText);

            const body = document.querySelector(
              ".ssrcss-uf6wea-RichTextComponentWrapper p b",
            )?.innerText;

            return {
              body,
              summary: body,
              topic: "US-CANADA",
              reading_time: bodyText?.length || 400,
              title: document.querySelector("h1")?.innerText,
              images_url: document.querySelector(".ssrcss-1drmwog-Image").src,
              tag,
              published_at: document.querySelector("time")?.dateTime || "today",
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
        console.log(singleData);
        await newTab.waitForTimeout(2000);
        await newTab.close();
      } catch (e) {
        await newTab.close();
        console.log("navigation error", e);
      }
    }
  }

  async function paginate() {
    try {
      const nextClick = await page.$(".qa-pagination-next-page");
      if (nextClick) {
        console.log("pagination found...");

        await Promise.all([page.click(".qa-pagination-next-page")]);
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

  async function collectData() {
    io.emit("work-process", { data: "Working..." });
    try {
      io.emit("work-process", { data: "Schedule Job Starts..." });
      if (count > 5) {
        await page.close();
        await browser.close();
        io.emit("work-process", { data: null });
        console.log("Finished...");
        return false;
      }
      console.log("Data collection started");
      let results = await page.evaluate(() => {
        return [
          ...document.querySelectorAll("ol li.lx-stream__post-container"),
        ].map((element) => {
          const article = {
            domain: "bbc",
            domain_icon_url: document.querySelector(
              "link[rel='apple-touch-icon']",
            )?.href,
            content_url: element.querySelector("header h3 a")?.href,
            content_type: "news",
          };
          element.remove();
          //console.log(element.querySelector("header h3 a")?.href);
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
  bbc,
};
