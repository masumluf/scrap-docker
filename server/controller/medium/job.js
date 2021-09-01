const { startBrowser, startPage } = require("../helper/browserHelper");
const { scrollPageToBottom } = require("../helper/core");
const { addData } = require("../authController");
const { sanitizeDate } = require("../helper/dateSanitize");
const Queue = require("better-queue");
let page;
let count = 0;
let q = null;

async function medium(io) {
  const browser = await startBrowser();
  page = await startPage(browser);

  await page.goto("https://medium.com/", {
    waitUntil: "load",
    timeout: 0,
  });
  await scrollPageToBottom(page);
  await page.waitForTimeout(6000);

  async function navigateToNextTab(results) {
    q = new Queue(
      async (data) => {
        if (await addData(data)) {
          count--;
        } else {
          count++;
        }
      },
      { concurrent: results.length },
    );

    for (let result of results) {
      try {
        result.published_at = sanitizeDate(result.published_at);
        result.reading_time = parseInt(result.reading_time.split("")[0]) * 60;
        // result.topic = result
        // data storing to db
        q.push(result);
        //console.log(result);
      } catch (error) {
        console.log("navigation error", error);
      }
    }
  }

  async function paginate() {
    try {
      //count++;
      console.log("pagination found...");
      //console.log(count);
      await page.waitForTimeout(6000);
      await scrollPageToBottom(page);
      await page.waitForTimeout(6000);
      await collectData();
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
      console.log(count);
      if (count > 5) {
        await page.close();
        await browser.close();
        io.emit("work-process", { data: null });
        return false;
      }

      io.emit("work-process", { data: "Working..." });
      let results = await page.evaluate(() => {
        return [...document.querySelectorAll(".ae.di")]
          .slice(1)
          .map((element) => {
            let article = {
              domain: "medium",
              domain_icon_url: document.querySelector(
                "link[rel='apple-touch-icon']",
              )?.href,
              title: element.querySelector("div")?.querySelector("h2")
                ?.innerText,
              content_url: element.querySelector("h2")?.parentElement?.href,
              summary: element.querySelector("div").querySelector("h3")
                ? element.querySelector("div").querySelector("h3")?.innerText
                : "Nothing Found",
              body: element.querySelector("div").querySelector("h3")
                ? element.querySelector("div").querySelector("h3")?.innerText
                : "Nothing Found",

              reading_time: element.querySelector("span:nth-child(3)")
                ?.innerText,
              published_at: element.querySelector("div").querySelector("span")
                ?.innerText,
              author_name:
                element.querySelector("div").querySelector("h4")?.innerText ??
                "medium",
              images_url:
                element.querySelector("div").querySelector("img")?.src ?? "",
              topic: element.querySelector(".ca.b.id.cc.ie span")
                ? element.querySelector(".ca.b.id.cc.ie span")?.innerText
                : "Life",
              content_type: "article",
            };

            element.remove();
            return article;
          });
      });
      //console.log(results);
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
    }
  }
  console.log("recheck pagination");
  await collectData();
}

module.exports = {
  medium,
};
