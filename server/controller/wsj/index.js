const { startBrowser, startPage } = require("../helper/browserHelper");
const { scrollPageToBottom } = require("../helper/core");
const { addData } = require("../authController");
const { sanitizeDate } = require("../helper/dateSanitize");
const Queue = require("better-queue");
let page;

async function wsj(req, res) {
  let count = 0;
  const browser = await startBrowser();
  page = await startPage(browser);
  const io = req.app.get("io");

  await page.goto("https://www.wsj.com/news/types/canada-news", {
    waitUntil: "networkidle2",
  });
  await scrollPageToBottom(page);
  await page.waitForTimeout(2000);

  async function paginate() {
    try {
      const nextClick = await page.$(
        ".WSJTheme--SimplePaginator__right--2syX0g5l a",
      );
      if (nextClick) {
        count++;
        console.log("pagination found");
        console.log(count);
        await Promise.all([
          page.click(".WSJTheme--SimplePaginator__right--2syX0g5l a"),
        ]);
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
      { concurrent: results.length },
    );

    for (let result of results) {
      let newTab;
      try {
        newTab = await startPage(browser);
        await newTab.goto(result.content_url, { waitUntil: "networkidle2" });

        console.log("collecting data from next tab..");
        const singleData = await newTab.evaluate(async () => {
          try {
            return {
              reading_time:
                document.querySelector(".snippet")?.innerText?.length || 400,
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
      io.emit("work-process", { data: "Working..." });
      let results = await page.evaluate(() => {
        return [...document.querySelectorAll("#latest-stories article")].map(
          (element) => {
            return {
              domain: "wsj",
              domain_icon_url: document.querySelector(
                "link[rel='shortcut icon']",
              )?.href,
              title: element.querySelector("h2")?.innerText,
              content_url: element.querySelector("h2 a")?.href,
              images_url: element.querySelector("img")?.src,
              topic: "News",
              author_name:
                element.querySelector("div p:nth-child(1)").innerText ?? "wsj",
              published_at: element.querySelector(
                "div:nth-child(2) > div:nth-child(3) div",
              )?.innerText,
              summary: element.querySelector("p")?.innerText,
              body: element.querySelector("p")?.innerText,
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
  wsj,
};
