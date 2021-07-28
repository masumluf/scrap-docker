const { startBrowser, startPage } = require("../helper/browserHelper");
const { scrollPageToBottom } = require("../helper/core");
const { addData } = require("../authController");
const { sanitizeDate } = require("../helper/dateSanitize");
const Queue = require("better-queue");
let page;

async function travelbreak(req, res) {
  let count = 0;
  const browser = await startBrowser();
  page = await startPage(browser);
  const io = req.app.get("io");

  await page.goto("https://www.travel-break.net/travel-posts", { waitUntil: "domcontentloaded" });
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
          waitUntil: "domcontentloaded",
          timeout: 60000,
        });

        console.log("collecting data from next tab..");
        const singleData = await newTab.evaluate(async () => {
          try {
            const regexBody = /(<([^>]+)>)|\n|\t|\s{2,}|"|'/gi;
            const bodyData = document
              .querySelector(".post-content")
              ?.innerText.replace(regexBody, " ")
              .trim();
            let index = bodyData.indexOf("minutes");
            index = index > -1 ? index + 7 : 0;
            return {
              summary: bodyData?.substring(index, 150),
              body: bodyData?.substring(index, 350),
              reading_time: bodyData?.length || 400,
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
        return [
          ...document.querySelectorAll("#posts-container article > div"),
        ].map((element) => {
          const article = {
            domain: "backpackerbanter",
            domain_icon_url: document.querySelector("link[rel='shortcut icon']")?.href,
            title: element.querySelector("h2")?.innerText,
            content_url: element.querySelector("h2 a")?.href,
            images_url: element.querySelector("img")?.src || "",
            author_name: "Stephanie Be",
            topic: "travel",
            published_at:
              element.querySelector(".updated")?.textContent || "today",
            content_type: "article",
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
  travelbreak,
};
