const { startBrowser, startPage } = require("../helper/browserHelper");
const { scrollPageToBottom } = require("../helper/core");
const { addData } = require("../authController");
const { sanitizeDate } = require("../helper/dateSanitize");
const Queue = require("better-queue");
let page;

async function bbc(io) {
  //let { topicName } = req.body;
  let count = 0;
  const browser = await startBrowser();
  page = await startPage(browser);
  //const io = req.app.get("io");

  await page.goto("https://www.bbc.com/news/world/us_and_canada", {
    waitUntil: "networkidle2",
  });
  await scrollPageToBottom(page);
  await page.waitForTimeout(2000);

  async function navigateToNextTab(results) {
    const q = new Queue(
      async (data) => {
        await addData(data);
      },
      { concurrent: results.length },
    );

    for (let result of results) {
      let newTab;
      try {
        console.log(result);
        newTab = await startPage(browser);
        if (result?.content_url) {
          await newTab.goto(result.content_url, {
            waitUntil: "domcontentloaded",
            timeout: 5000,
          });

          console.log("collecting data from next tab..");
          const singleData = await newTab.evaluate(async () => {
            try {
              const body = document.querySelector("article")?.textContent;
              console.log("find out...");
              return {
                topic: "US-Canada",
                published_at:
                  document.querySelector("time")?.dateTime || "today",
                reading_time: body?.length || 400,
                body: body?.substring(0, 400),
                images_url: document.querySelector(".ssrcss-1drmwog-Image").src,
                summary: body?.substring(0, 200),
              };
            } catch (error) {
              console.log(error);
            }
          });

          //singleData.published_at = sanitizeDate(singleData.published_at);
          // data storing to db
          if (singleData) {
            q.push({
              ...singleData,
              ...result,
            });
            await newTab.waitForTimeout(2000);
            await newTab.close();
          } else {
            let obj = {
              images_url:
                "https://yt3.ggpht.com/ytc/AKedOLSJf_PYHF9czwJ0c99ARvsOkYLzoUGXSVhvOvlAkoc=s900-c-k-c0x00ffffff-no-rj",
              topic: "US-Canada",
            };
            q.push({
              ...obj,
              ...result,
            });
            await newTab.waitForTimeout(2000);
            await newTab.close();
          }
        } else {
          await newTab.close();
          continue;
        }
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
        count++;
        console.log("pagination found...");
        console.log(count);
        await Promise.all([
          page.click(".lx-pagination__controls:nth-child(3) a"),
        ]);
        await page.waitForTimeout(4000);
        await scrollPageToBottom(page);
        await page.waitForTimeout(4000);
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
    try {
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
            title: element.querySelector("header h3")?.innerText,
            content_url: element.querySelector("header h3 a")?.href,

            summary: element.querySelector("p.lx-stream-related-story--summary")
              ?.innerText,
            body: element.querySelector("p.lx-stream-related-story--summary")
              ?.innerText,
            author_name:
              element.querySelector("p.qa-contributor-name")?.innerText ??
              "bbc",
            content_type: "news",
          };
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
