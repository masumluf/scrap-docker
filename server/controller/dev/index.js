const { startBrowser, startPage } = require("../helper/browserHelper");
const { scrollPageToBottom } = require("../helper/core");
const { addData } = require("../authController");
const { sanitizeDate } = require("../helper/dateSanitize");
let page;

async function dev(req, res) {
  let count = 0;
  const browser = await startBrowser();
  page = await startPage(browser);
  const io = req.app.get("io");

  await page.goto("https://dev.to", { waitUntil: "networkidle2" });
  await scrollPageToBottom(page);
  await page.waitForTimeout(2000);

  async function navigateToNextTab(results) {
    for (let result of results) {
      const newTab = await startPage(browser);
      await newTab.goto(result.content_url, {
        waitUntil: "domcontentloaded",
        timeout: 0,
      });

      console.log("collecting data from next tab..");
      const singleData = await newTab.evaluate(async () => {
        try {
          const regexBody = /(<([^>]+)>)|\n|\t|\s{2,}|"|'/gi;
          const body = document
            .querySelector(".crayons-article__body")
            ?.innerText.replace(regexBody, " ");
          return {
            images_url: document.querySelector("img")?.src ?? "",
            summary:
              document.querySelector(".crayons-article__body p")?.innerText ??
              body?.substring(0, 150),
            body: body?.substring(0, 350),
            reading_time: body?.length || 400,
          };
        } catch (error) {
          console.log(error);
        }
      });

      result.published_at = sanitizeDate(result.published_at);
      // data storing to db
      await addData({
        ...result,
        ...singleData,
      });
      await newTab.waitForTimeout(2000);
      await newTab.close();
    }
  }

  async function paginate() {
    try {
      count++;
      console.log(count);
      await scrollPageToBottom(page);
      await page.waitForTimeout(2000);
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
    try {
      console.log("Data collection started");
      io.emit("work-process", { data: "Working..." });
      let results = await page.evaluate(() => {
        return [...document.querySelectorAll(".crayons-story__body")].map(
          (element) => {
            const article = {
              domain: "dev",
              domain_icon_url: document.querySelector("link[rel='icon']")?.href,
              title:
                element.querySelector("h2")?.innerText ??
                element.querySelector("h3")?.innerText,
              content_url:
                element.querySelector("h2 a")?.href ??
                element.querySelector("h3 a")?.href,
              topic:
                element
                  .querySelector(".crayons-tag")
                  ?.innerText.replace("#", "") ?? "coding",
              author_name:
                element.querySelector(".crayons-story__meta p")?.innerText ??
                "dev",
              published_at:
                element.querySelector("time")?.dateTime ||
                element.querySelector("time span")?.innerText.replace(/\(|\)/g, "") ||
                element.querySelector("time")?.innerText,
              content_type: "article",
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
      console.log("error found", e);
      await collectData();
    }
  }
  console.log("recheck pagination");
  await collectData();
}

module.exports = {
  dev,
};
