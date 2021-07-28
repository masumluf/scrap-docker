const { startBrowser, startPage } = require("../helper/browserHelper");
const { scrollPageToBottom } = require("../helper/core");
const { addData } = require("../authController");
const { sanitizeDate } = require("../helper/dateSanitize");
const Queue = require("better-queue");
let page;

async function chicagotribune(req, res) {
  let { topicName } = req.body;
  let count = 0;

  const browser = await startBrowser();
  page = await startPage(browser);
  const io = req.app.get("io");

  await page.goto(`https://www.chicagotribune.com/${topicName}`, {
    waitUntil: "networkidle2",
  });
  await scrollPageToBottom(page);
  await page.waitForTimeout(2000);

  async function navigateToNextTab(results) {
    const q = new Queue(
      async (data) => {
        await addData(data);
      },
      { concurrent: results.length }
    );
    for (let result of results) {
      let newTab;
      try {
        newTab = await startPage(browser);
        await newTab.goto(result.content_url, {
          waitUntil: "networkidle2"
        });
        await scrollPageToBottom(newTab);
        await newTab.waitForTimeout(2000);

        console.log("collecting data from next tab..");
        const singleData = await newTab.evaluate(async () => {
          try {
            const regexBody = /(<([^>]+)>)|\n|\t|\s{2,}|"|'/ig;
            const body = document.querySelector(".pb-f-article-body")?.innerText.trim().replace(regexBody, " ");
            return {
              published_at:
                document
                  .querySelector(".timestamp-wrapper div:last-child .timestamp")
                  ?.innerText.trim() || "today",
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
      } catch (e) {
        await newTab.close();
        console.log("navigation error", e);
      }
    }
  }

  async function paginate() {
    try {
      count++;
      console.log("pagination found...");
      console.log(count);
      await page.waitForTimeout(6000);
      await scrollPageToBottom(page);
      await page.waitForTimeout(6000);
      await collectData();
    } catch (e) {
      console.log("Pagination Error Found", e);
      await page.close();
      await browser.close();
      io.emit("work-process", { data: null });
      return res.status(422).json(false);
    }
  }

  async function collectData() {
    io.emit("work-process", { data: "Working..." });
    try {
      console.log("Data collection started");
      let results = await page.evaluate(() => {
        return [
          ...document.querySelectorAll(".story--clln > li > .crd")
        ].map((element) => {
          const article = {
            domain: "chicagotribune",
            domain_icon_url: document.querySelector("link[rel='apple-touch-icon']")?.href,
            title: element.querySelector("h2")?.innerText,
            content_url: element.querySelector("h2 a")?.href,
            author_name: element.querySelector(".byline a")?.textContent || "chicagotribune",
            images_url: element.querySelector("figure img")?.currentSrc || "",
            topic: element.querySelector(".li--topic--it")?.innerText || "News",
            summary: element.querySelector(".story-preview")?.innerText,
            body: element.querySelector(".story-preview")?.innerText,
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
        return res.status(422).json(false);
      }

      await navigateToNextTab(results);
      await paginate();
    } catch (e) {
      console.log("error found", e);
    }
  }
  console.log("recheck pagination");
  await collectData();
}

module.exports = {
  chicagotribune,
};
