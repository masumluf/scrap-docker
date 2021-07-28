const { startBrowser, startPage } = require("../helper/browserHelper");
const { scrollPageToBottom } = require("../helper/core");
const { addData } = require("../authController");
const { sanitizeDate } = require("../helper/dateSanitize");
const Queue = require("better-queue");
let page;
let count = 0;
let q = null;

async function nypost(io) {
  const browser = await startBrowser();
  page = await startPage(browser);
  // const io = req.app.get("io");

  await page.goto("https://nypost.com/news", { waitUntil: "networkidle2" });
  await scrollPageToBottom(page);
  await page.waitForTimeout(2000);

  async function paginate() {
    try {
      const nextClick = await page.$(".more-link a");
      if (nextClick) {
        console.log("pagination found");
        //console.log(count);
        await page.evaluate(() => {
          document.querySelector(".more-link a").click();
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
        return true;
      }
    } catch (e) {
      console.log("Pagination Error Found", e);
      await page.close();
      await browser.close();
      io.emit("work-process", { data: null });
      return false;
    }
  }

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
          waitUntil: "networkidle2",
        });

        console.log("collecting data from next tab..");
        const singleData = await newTab.evaluate(async () => {
          try {
            const regexBody = /(<([^>]+)>)|\n|\t|\s{2,}|"|'/gi;
            const body = document
              .querySelector(".entry-content")
              ?.innerText.replace(regexBody, " ");
            return {
              topic: document.querySelector(".tag-list a")?.innerText,
              author_name: document
                .querySelector("#author-byline p")
                ?.innerText.split("By")[1]
                .trim(),
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

      let results = await page.evaluate(() => {
        return [...document.querySelectorAll(".article-loop .article")].map(
          (element) => {
            const article = {
              domain: "nypost",
              domain_icon_url: document.querySelector(
                "link[rel='shortcut icon']"
              )?.href,
              title: element.querySelector("h3")?.innerText,
              content_url: element.querySelector("h3 a")?.href,
              images_url:
                element.querySelector("picture img")?.currentSrc ||
                "https://www.edithwharton.org/wp-content/uploads/2013/05/6a012876645fd3970c014e605f2d0c970c-320wi.jpg",
              published_at:
                element
                  .querySelector(".byline-date")
                  ?.innerText.split("|")[0]
                  .trim() || "today",
              summary: element
                .querySelector(".entry-content")
                ?.innerText.trim(),
              body: element.querySelector(".entry-content")?.innerText.trim(),
              content_type: "news",
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
        return true;
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
  nypost,
};
