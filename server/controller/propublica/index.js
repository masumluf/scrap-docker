const { startBrowser, startPage } = require("../helper/browserHelper");
const { scrollPageToBottom } = require("../helper/core");
const { addData } = require("../authController");
const { sanitizeDate } = require("../helper/dateSanitize");
const Queue = require("better-queue");
let page;

async function propublica(req, res) {
  let count = 0;
  const browser = await startBrowser();
  page = await startPage(browser);
  const io = req.app.get("io");

  await page.goto("https://www.propublica.org/archive", { waitUntil: "networkidle2" });
  await scrollPageToBottom(page);
  await page.waitForTimeout(2000);

  async function paginate() {
    try {
      const nextClick = await page.$(".pagination ul li:nth-last-child(2) a");
      if (nextClick) {
        count++;
        console.log("pagination found");
        console.log(count);
        await page.evaluate(() => {
          document.querySelector(".pagination ul li:nth-last-child(2) a").click();
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
          waitUntil: "networkidle2"
        });

        console.log("collecting data from next tab..");
        const singleData = await newTab.evaluate(async () => {
          try {
            const regexBody = /(<([^>]+)>)|\n|\t|\s{2,}|"|'/ig;
            const body = document.querySelector(".article-body")?.innerText.replace(regexBody, " ");
            return {
              reading_time: body?.length || 400
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

  async function collectData() {
    try {
      console.log("Data collection started");

      let results = await page.evaluate(() => {
        return [...document.querySelectorAll(".stories .section-articles")].map(
          (element) => {
            return {
              domain: "propublica",
              domain_icon_url: document.querySelector("link[rel='shortcut icon']")?.href,
              title: element.querySelector("h2")?.innerText,
              content_url: element.querySelector("h2 a")?.href,
              images_url: element.querySelector("img")?.currentSrc.split("?")[0] ?? "",
              topic: "News",
              author_name: element.querySelector(".byline")?.innerText.split("by ")[1]
                ?? element.querySelector(".byline")?.innerText
                ?? "propublica",
              published_at: element.querySelector("time")?.dateTime,
              summary: element.querySelector(".dek")?.innerText,
              body: element.querySelector(".dek")?.innerText,
              content_type: "news",
            };
          },
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
      console.log("Data collection Error Found", e);
    }
  }

  console.log("recheck pagination");
  await collectData();
}

module.exports = {
  propublica,
};
