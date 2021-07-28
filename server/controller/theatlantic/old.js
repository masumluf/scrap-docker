const { startBrowser, startPage } = require("../helper/browserHelper");
const { scrollPageToBottom } = require("../helper/core");
const { addData } = require("../authController");
const { sanitizeDate } = require("../helper/dateSanitize");
const Queue = require("better-queue");
let page;

async function theatlanticOld(req, res) {
  let { topicName } = req.body;
  let count = 0;

  const browser = await startBrowser();
  page = await startPage(browser);
  const io = req.app.get("io");

  await page.goto(`https://www.theatlantic.com/${topicName}`, {
    waitUntil: "networkidle2",
  });
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
            const body = document.querySelector("main")?.innerText.replace(regexBody, " ") ??
              document.querySelector(".article-body")?.innerText.replace(regexBody, " ");
            return {
              topic:
                document.querySelector("#rubric")?.innerText ??
                document.querySelector(".rubric")?.innerText ??
                "News",
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
      const nextClick = await page.$(".LandingRiver_paginationLink__UNWAr:last-child");
      if (nextClick) {
        count++;
        console.log("pagination found");
        console.log(count);
        await Promise.all([page.click(".LandingRiver_paginationLink__UNWAr:last-child")]);
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
      io.emit("work-process", { data: "Working..." });
      let results = await page.evaluate(() => {
        return [...document.querySelectorAll("section ul li article")].map(
          (element) => ({
            domain: "theatlantic",
            domain_icon_url: document.querySelector("link[rel='icon']")?.href,
            title: element.querySelector("a h2")?.innerText,
            content_url: element.querySelector("a")?.href,
            author_name: element.querySelector(".LandingMetadata_byline__HMivQ")?.innerText ?? "theatlantic",
            summary: element.querySelector("p")?.innerText,
            body: element.querySelector("p")?.innerText,
            published_at: element.querySelector("time")?.dateTime,
            images_url: element.querySelector("figure img")?.srcset.split(" ")[0] ?? "",
            content_type: "news",
          }),
        );
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
  theatlanticOld,
};
