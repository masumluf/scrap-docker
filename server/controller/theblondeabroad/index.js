const { startBrowser, startPage } = require("../helper/browserHelper");
const { scrollPageToBottom } = require("../helper/core");
const { addData } = require("../authController");
const { sanitizeDate } = require("../helper/dateSanitize");
const Queue = require("better-queue");
let page;

async function theblondeabroad(req, res) {
  let count = 0;
  const browser = await startBrowser();
  page = await startPage(browser);
  const io = req.app.get("io");

  await page.goto("https://www.theblondeabroad.com/travel-blog", { waitUntil: "domcontentloaded" });
  await scrollPageToBottom(page);
  await page.waitForTimeout(2000);

  async function paginate() {
    try {
      const nextClick = await page.$(".pagination-next");
      if (nextClick) {
        count++;
        console.log("pagination found");
        console.log(count);
        await Promise.all([page.click(".pagination-next")]);
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
          timeout: 60000,
        });

        console.log("collecting data from next tab..");
        const singleData = await newTab.evaluate(async () => {
          try {
            const regexBody = /(<([^>]+)>)|\n|\t|\s{2,}|"|'/gi;
            const body = document
              ?.querySelector(".entry-content")
              ?.innerText.replace(regexBody, " ");
            return {
              published_at:
                document.querySelector("head > meta[property='article:published_time']")?.content ||
                "today",
              summary: body?.substring(0, 150),
              body: body?.substring(0, 350),
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
      console.log("Data collection started");

      let results = await page.evaluate(() => {
        return [
          ...document.querySelectorAll(".blog-wrap article"),
        ].map((element) => {
          const article = {
            domain: "theblondeabroad",
            domain_icon_url: document.querySelector("link[rel='icon']")?.href,
            title: element.querySelector("h2")?.innerText,
            content_url: element.querySelector("h2 a")?.href,
            images_url: element.querySelector("img")?.src || "",
            author_name: "Keirsten",
            topic: "travel",
            content_type: "article",
          };
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
      console.log("Data collection Error Found", e);
    }
  }

  console.log("recheck pagination");
  await collectData();
}

module.exports = {
  theblondeabroad,
};
