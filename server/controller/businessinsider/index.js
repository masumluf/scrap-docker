const { startBrowser, startPage } = require("../helper/browserHelper");
const { scrollPageToBottom } = require("../helper/core");
const { addData } = require("../authController");
const { sanitizeDate } = require("../helper/dateSanitize");
const Queue = require("better-queue");

let page;

async function businessinsider(req, res) {
  let count = 0;
  const browser = await startBrowser();
  page = await startPage(browser);
  const io = req.app.get("io");

  await page.goto("https://www.businessinsider.com/latest", {
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
            const body =
              document.querySelector(".content-lock-content")?.innerText ??
              document.querySelector(".news-content")?.innerText;
            return {
              author_name: document.querySelector(".byline-link")
                ? document.querySelector(".byline-link")?.innerText
                : "businessinsider",
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
    count++;
    console.log(count);
    try {
      const nextClick = await page.$("#l-content > a.river-more-link");
      if (nextClick) {
        console.log("pagination found...");
        await Promise.all([page.click("#l-content > a.river-more-link")]);
        await page.waitForTimeout(3000);
        await scrollPageToBottom(page);
        await page.waitForTimeout(2000);
        await collectData();
      } else {
        await scrollPageToBottom(page);
        await page.waitForTimeout(2000);
        await collectData();
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
          ...document.querySelectorAll("#l-content > section.featured-post"),
        ].map((element) => {
          const article = {
            domain: "businessinsider",
            domain_icon_url: document.querySelector("link[rel='shortcut icon']")
              ?.href,
            title: element.querySelector("h2")?.innerText,
            content_url: element.querySelector("h2 a")?.href,
            published_at: element.querySelector(".js-date-format")
              ? element.querySelector(".js-date-format")?.innerText
              : "today",
            images_url:
              Object?.keys(
                JSON?.parse(
                  element.querySelector("img")?.getAttribute("data-srcs") ??
                    "{}"
                )
              )[0] ?? "",
            topic:
              element.querySelector("div a.headline-bold")?.innerText ?? "News",
            summary: element.querySelector("section > div > div")?.innerText,
            body: element.querySelector("section > div > div")?.innerText,
            content_type: "article",
          };
          element.remove();
          return article;
        });
      });
      if (results.length === 0) {
        console.log(results);
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
  businessinsider,
};
