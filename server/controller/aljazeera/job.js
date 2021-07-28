const { startBrowser, startPage } = require("../helper/browserHelper");
const { scrollPageToBottom } = require("../helper/core");
const { addData } = require("../authController");
const { sanitizeDate } = require("../helper/dateSanitize");
const Queue = require("better-queue");
let page;
let count = 0;
let q = null;

async function aljazeera(io) {
  let count = 0;
  const browser = await startBrowser();
  page = await startPage(browser);

  await page.goto("https://www.aljazeera.com/us-canada", {
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
            return {
              author_name:
                document.querySelector(".article-author-name-item")
                  ?.innerText ?? "aljazeera",
              topic: document.querySelector(".topics > a").innerText,
              reading_time:
                document.querySelector(".gallery-content")?.innerText?.length ||
                400,
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
      const nextClick = await page.$("button.section-card-list--button");
      if (nextClick) {
        // count++;
        console.log("pagination found...");
        console.log(count);
        await Promise.all([page.click("button.section-card-list--button")]);
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
    try {
      io.emit("work-process", { data: "Schedule Job Starts..." });
      if (count > 5) {
        await page.close();
        await browser.close();
        io.emit("work-process", { data: null });
        return false;
      }
      let results = await page.evaluate(() => {
        return [...document.querySelectorAll("article")].map((element) => {
          const regexImg = /www.aljazeera.com/g;
          const imgUrl = element.querySelector("img.gc__image")?.src;
          const images_url = regexImg.test(imgUrl)
            ? imgUrl
            : "https://www.aljazeera.com" + imgUrl;

          const article = {
            domain: "aljazeera",
            domain_icon_url: document.querySelector("link[rel='shortcut icon']")
              .href,
            title: element.querySelector("h3")?.innerText.trim(),
            content_url: element.querySelector("h3 a")?.href,
            images_url,
            summary: element.querySelector(".gc__excerpt")?.innerText.trim(),
            body: element.querySelector(".gc__excerpt")?.innerText.trim(),
            published_at: element.querySelector(".date-simple")?.innerText,
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
  aljazeera,
};
