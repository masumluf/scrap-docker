const { startBrowser, startPage } = require("../helper/browserHelper");
const { scrollPageToBottom } = require("../helper/core");
const { addData } = require("../authController");
const { sanitizeDate } = require("../helper/dateSanitize");
const Queue = require("better-queue");
let page;

async function seriouseats(req, res) {
  let count = 0;
  const browser = await startBrowser();
  page = await startPage(browser);
  const io = req.app.get("io");

  await page.goto("https://www.seriouseats.com", {
    waitUntil: "networkidle2",
  });
  await scrollPageToBottom(page);
  await page.waitForTimeout(2000);

  async function paginate() {
    try {
      const nextClick = await page.$(".btn.btn-tertiary");
      if (nextClick) {
        count++;
        console.log("pagination found...");
        console.log(count);
        await Promise.all([page.click(".btn.btn-tertiary")]);
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
          timeout: 0,
        });
  
        console.log("collecting data from next tab..");
        const singleData = await newTab.evaluate(async () => {
          try {
            const regexBody = /(<([^>]+)>)|\n|\t|\s{2,}|"|'/ig;
            const body = document.querySelector(".entry-body")?.innerText.replace(regexBody, " ") ??
              document.querySelector(".recipe-body")?.innerText.replace(regexBody, " ")
            return {
              author_name:document.querySelector(".author-name")?.innerText ?? "seriouseats",
              published_at: document.querySelector(".publish-date time")?.innerText,
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
      io.emit("work-process", { data: "Working.." });
      console.log("Data collection started");
      let results = await page.evaluate(() => {
        let foodData = [...document.querySelectorAll("div.content-main article")];
        document.querySelector(".btn.btn-tertiary").click();
        return foodData.map(
          (element) => {
            const article = {
              domain: "seriouseats",
              domain_icon_url: document.querySelector("link[rel='shortcut icon']")?.href,
              title: element.querySelector(".c-card__title")?.innerText,
              content_url: element.querySelector(".c-card__title a")?.href,
              topic: element.querySelector(".c-card__category")?.innerText,
              images_url: element.querySelector("img")?.getAttribute("data-src") ?? "",
              summary: element.querySelector("p.c-card__kicker")?.innerText,
              body: element.querySelector("p.c-card__kicker")?.innerText,
              content_type: "article",
            };
            element.remove();
            return article;
          }
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
    }
  }
  console.log("recheck pagination");
  await collectData();
}

module.exports = {
  seriouseats,
};
