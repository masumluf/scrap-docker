const { startBrowser, startPage } = require("../helper/browserHelper");
const { scrollPageToBottom } = require("../helper/core");
const { addData } = require("../authController");
const { sanitizeDate } = require("../helper/dateSanitize");
const Queue = require("better-queue");
let page;

async function canadavisa(req, res) {
  let count = 0;
  const browser = await startBrowser();
  page = await startPage(browser);
  const io = req.app.get("io");

  await page.goto("https://www.canadavisa.com/news/latest.html", { waitUntil: "networkidle2" });
  await scrollPageToBottom(page);
  await page.waitForTimeout(2000);

  async function paginate() {
    try {
      const nextPage = await page.evaluate(() => {
        const pagination = document.querySelector(".page-item:nth-child(3):not(.d-none) a")
          ?? document.querySelector(".page-item:nth-child(2):not(.d-none) a");
        const textValue = pagination?.innerText;
        if (textValue && textValue == "Next") {
          return pagination?.href;
        }
        else return false;
      });
      if (nextPage) {
        count++;
        console.log("pagination found");
        console.log(count);
        await page.goto(nextPage, { waitUntil: "networkidle2" });
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
          timeout: 0,
        });

        console.log("collecting data from next tab..");
        const singleData = await newTab.evaluate(async () => {
          try {
            const regexBody = /(<([^>]+)>)|\n|\t|\s{2,}|"|'/ig;
            const bodyReadTime = document.querySelector(".container.content")?.innerText.replace(regexBody, " ");
            return {
              reading_time: bodyReadTime?.length || 400,
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
        return [...document.querySelectorAll(".container .news-row")].map(
          (element) => {
            return {
              domain: "canadavisa",
              domain_icon_url: document.querySelector("link[rel='shortcut icon']")?.href,
              title: element.querySelector("h3")?.innerText,
              content_url: element.querySelector("h3 a")?.href,
              topic: "News",
              author_name: element.querySelector(".pb-1 span a")?.innerText ?? "canadavisa",
              published_at: element.querySelector(".pb-1 span:last-child")?.innerText,
              images_url: element.querySelector("img")?.src ?? "",
              summary: element.querySelector(".col-12 p")?.innerText,
              body: element.querySelector(".col-12 p")?.innerText,
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
  canadavisa
};
