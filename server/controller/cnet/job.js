const { startBrowser, startPage } = require("../helper/browserHelper");
const { scrollPageToBottom } = require("../helper/core");
const { addData } = require("../authController");
const { sanitizeDate } = require("../helper/dateSanitize");
const Queue = require("better-queue");

let page;
let count = 0;
let q = null;

async function cnet(io) {
  const browser = await startBrowser();
  page = await startPage(browser);
  //const io = req.app.get("io");

  await page.goto("https://www.cnet.com/more-news", {
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
          waitUntil: "domcontentloaded",
          timeout: 0,
        });

        console.log("collecting data from next tab..");
        // console.log(newTab);
        const singleData = await newTab.evaluate(async () => {
          try {
            const regexBody = /(<([^>]+)>)|\n|\t|\s{2,}|"|'/gi;
            const body = document
              .querySelector(".article-main-body")
              ?.innerText.replace(regexBody, " ");
            const images_url = document.querySelector("figure img").src;
            //console.log();
            const topic = document.querySelector(".text").innerText;
            console.log("cnet log..");
            return {
              reading_time: body?.length || 400,
              topic,
              images_url,
            };
          } catch (error) {
            console.log(error);
          }
        });

        result.published_at = sanitizeDate(result.published_at);
        // data storing to db
        //console.log(singleData);
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
      const nextClick = await page.$(".load-more");
      if (nextClick) {
        console.log("pagination found...");

        await page.goto(`https://www.cnet.com/more-news/${count + 1}`, {
          waitUntil: "networkidle2",
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
        return [
          ...document.querySelectorAll(
            ".latestScrollContainer .item:not(.large)",
          ),
        ].map((element) => ({
          domain: "cnet",
          domain_icon_url: document.querySelector(
            "link[rel='apple-touch-icon']",
          )?.href,
          title: element.querySelector("a h3")?.innerText,
          content_url: element.querySelector("a")?.href,
          topic: element.querySelector(".topicLink")?.innerText,
          author_name:
            element.querySelector(".author .authorLink")?.innerText || "cnet",
          published_at:
            element.querySelector(".assetInfo .timeAgo")?.textContent ||
            "today",

          summary: element.querySelector("a p")?.innerText,
          body: element.querySelector("a p")?.innerText,
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
  cnet,
};
