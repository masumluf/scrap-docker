const { startBrowser, startPage } = require("../helper/browserHelper");
const { scrollPageToBottom } = require("../helper/core");
const { addData } = require("../authController");
const { sanitizeDate } = require("../helper/dateSanitize");
const Queue = require("better-queue");
let page;

async function nytimes(req, res) {
  let count = 0;
  const browser = await startBrowser();
  page = await startPage(browser);
  const io = req.app.get("io");

  await page.goto("https://www.nytimes.com/section/world", { waitUntil: "networkidle2" });
  await scrollPageToBottom(page);
  await page.waitForTimeout(2000);

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
            const body = document.querySelector(".meteredContent")?.innerText.replace(regexBody, " ");
            return {
              topic: document.querySelector(".css-8kn4zf > strong")?.innerText ||
                document.querySelector(".css-tsacue")?.innerText ||
                "News",
              summary: body?.substring(0, 150),
              body: body?.substring(0, 350),
              reading_time: body?.length || 400,
            };
          } catch (error) {
            console.log(error);
          }
        });

        result.published_at = sanitizeDate(result.published_at);
        // data storing to db
        q.push({
          ...singleData,
          ...result,
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
        return [...document.querySelectorAll("#stream-panel li > div")].map(
          (element) => {
            const article = {
              domain: "nytimes",
              domain_icon_url: document.querySelector("link[rel='shortcut icon']")?.href,
              title: element.querySelector("a h2")?.innerText,
              content_url: element.querySelector("a")?.href,
              images_url: element.querySelector("figure img")?.src || "",
              author_name: element.querySelector(".css-1n7hynb")?.textContent.replace(/and/, ",") || "nytimes",
              published_at: element.querySelector(".css-1lc2l26")?.innerText || "today",
              summary: element.querySelector(".css-1echdzn")?.innerText,
              body: element.querySelector(".css-1echdzn")?.innerText,
              content_type: "news",
            };
            element.remove();
            return article;
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
  nytimes
};
