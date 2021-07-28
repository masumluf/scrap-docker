const { startBrowser, startPage } = require("../helper/browserHelper");
const { scrollPageToBottom } = require("../helper/core");
const { addData } = require("../authController");
const { sanitizeDate } = require("../helper/dateSanitize");
const Queue = require("better-queue");
let page;

async function cbcOld(req, res) {
  let { topicName } = req.body;
  let count = 0;

  const browser = await startBrowser();
  page = await startPage(browser);
  const io = req.app.get("io");

  await page.goto(`https://www.cbc.ca/news/${topicName}`, {
    waitUntil: "networkidle2",
  });
  await scrollPageToBottom(page);
  await page.waitForTimeout(2000);

  async function navigateToNextTab(results) {
    const q = new Queue(
      async (data) => {
        await addData(data);
      },
      { concurrent: results.length }
    );
    for (let result of results) {
      if (result.topic.toLowerCase() == "listen") {
        continue;
      }

      let newTab;
      try {
        newTab = await startPage(browser);
        await newTab.goto(result.content_url, {
          waitUntil: "networkidle2",
        });
        await scrollPageToBottom(newTab);
        await newTab.waitForTimeout(2000);

        console.log("collecting data from next tab..");
        const singleData = await newTab.evaluate(async () => {
          try {
            const regexBody = /(<([^>]+)>)|\n|\t|\s{2,}|"|'/gi;
            const body =
              document
                .querySelector(".story")
                ?.innerText.trim()
                .replace(regexBody, " ") ??
              document
                .querySelector(".view-entry")
                ?.innerText.trim()
                .replace(regexBody, " ") ??
              document
                .querySelector(".entry-item-body")
                ?.innerText.trim()
                .replace(regexBody, " ") ??
              document
                .querySelector(".content")
                ?.innerText.trim()
                .replace(regexBody, " ");
            return {
              author_name:
                document.querySelector(".authorText")?.innerText ??
                document.querySelector("#content .byline p")?.innerText ??
                document.querySelector(".entry-meta-author")?.innerText ??
                "cbc",
              images_url:
                document.querySelector(".entry-lead-figure img")?.src ??
                document.querySelector("figure img")?.src ??
                document.querySelector("#content img")?.src ??
                document.querySelector(".content img")?.src ??
                "",
              summary:
                document.querySelector(".deck")?.innerText ??
                document.querySelector(".view-entry p")?.innerText.trim() ??
                document.querySelector(".story p")?.innerText.trim() ??
                document
                  .querySelector(".entry-item-body p")
                  ?.innerText.trim() ??
                document.querySelector(".content p")?.innerText.trim(),
              body: body.substring(0, 350),
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
      } catch (e) {
        await newTab.close();
        console.log("navigation error", e);
      }
    }
  }

  async function paginate() {
    try {
      const nextClick = await page.$(".loadMore");
      if (nextClick) {
        count++;
        console.log("pagination found...");
        console.log(count);
        await Promise.all([page.click(".loadMore")]);
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

  async function collectData() {
    io.emit("work-process", { data: "Working..." });
    try {
      console.log("Data collection started");
      let results = await page.evaluate(() => {
        return [
          ...document.querySelectorAll(".contentListCards a.cardDefault"),
        ].map((element) => {
          const article = {
            domain: "cbc",
            domain_icon_url: document.querySelector("link[rel='icon']")?.href,
            title: element.querySelector("h3")?.innerText,
            content_url: element?.href,
            published_at: document.querySelector(".timeStamp")?.dateTime,
            topic: element
              .querySelectorAll("span")[0]
              ?.innerText.replace(/[^a-z0-9,. ]/gi, "")
              .trim(),
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
  cbcOld,
};
