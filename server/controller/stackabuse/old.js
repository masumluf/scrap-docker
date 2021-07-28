const { startBrowser, startPage } = require("../helper/browserHelper");
const { scrollPageToBottom } = require("../helper/core");
const { addData } = require("../authController");
const { sanitizeDate } = require("../helper/dateSanitize");
const Queue = require("better-queue");
let page;

async function stackabuseOld(req, res) {
  let { topicName } = req.body;
  let count = 0;

  const browser = await startBrowser();
  page = await startPage(browser);
  const io = req.app.get("io");

  await page.goto(`https://stackabuse.com/tag/${topicName}`, { waitUntil: "networkidle0" });
  await scrollPageToBottom(page);
  await page.waitForTimeout(2200);

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
          waitUntil: "domcontentloaded",
          timeout: 0,
        });

        console.log("collecting data from next tab..");
        const singleData = await newTab.evaluate(async () => {
          try {
            const regexBody = /(<([^>]+)>)|\n|\t|\s{2,}|"|'/ig;
            const body = document.querySelector(".post")?.innerText.replace(regexBody, " ");
            return {
              images_url: document.querySelector("img")?.src ?? "",
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
      const nextClick = await page.$("a.older-posts");
      if (nextClick) {
        count++;
        console.log("pagination found");
        console.log(count);
        await Promise.all([page.click("a.older-posts")]);
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

  async function collectData() {
    try {
      console.log("Data collection started");
      let results = await page.evaluate(() => {
        return [
          ...document.querySelectorAll(".container article")
        ].map((element) => ({
          domain: "stackabuse",
          domain_icon_url: document.querySelector("link[rel='shortcut icon']")?.href,
          title: element.querySelector("h2")?.innerText,
          content_url: element.querySelector("h2 a")?.href,
          author_name: element.querySelector(".author a")?.innerText ?? "stackabuse",
          summary: element.querySelector(".post-content")?.innerText,
          body: element.querySelector(".post-content")?.innerText,
          published_at: element.querySelector("span.date")?.innerText ?? "today",
          topic: document.querySelector(".pull-left")?.innerText.trim() ?? "tech",
          content_type: "article",
        }));
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
      await collectData();
    }
  }
  console.log("recheck pagination...");
  await collectData();
}

module.exports = {
  stackabuseOld
};
