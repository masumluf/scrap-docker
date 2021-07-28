const { startBrowser, startPage } = require("../helper/browserHelper");
const { scrollPageToBottom } = require("../helper/core");
const { addData } = require("../authController");
const { sanitizeDate } = require("../helper/dateSanitize");
const Queue = require("better-queue");
let page;
let count = 0;
let q = null;

async function globalnews(io) {
  const browser = await startBrowser();
  page = await startPage(browser);

  await page.goto("https://globalnews.ca/latest", {
    waitUntil: "networkidle2",
  });
  await scrollPageToBottom(page);
  await page.waitForTimeout(2000);

  async function navigateToNextTab(results) {
    q = new Queue(
      async (data) => {
        if (await addData(data)) {
          count--;
        } else {
          count++;
        }
      },
      { concurrent: results.length }
    );
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
          const mainBody = document
            .querySelector(".l-article__text.js-story-text")
            ?.innerText.replace(regexBody, " ");
          const author_name =
            document.querySelector(".c-byline__name")?.innerText ?? "dev";
          const tag = [...document.querySelectorAll(".c-tags a")].map(
            (i) => i?.innerText
          );
          return {
            images_url:
              document.querySelector(".c-posts__thumbnail")?.src ??
              "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRsY8u2F6INWLAgjxnylzgIdToIlsGiFxgOag&usqp=CAU",
            summary: mainBody?.substring(0, 150),
            body: mainBody?.substring(0, 350),
            reading_time: mainBody?.length || 400,
            author_name,
            tag,
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
      //console.log({ ...result, ...singleData });

      await newTab.waitForTimeout(2000);
      await newTab.close();
    }
  }

  async function paginate() {
    try {
      const nextClick = await page.$("#latestStories-button");
      if (nextClick) {
        console.log("pagination found");

        await page.evaluate(() => {
          document.querySelector("#latestStories-button").click();
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
      //console.log(count);
      if (count > 5) {
        await page.close();
        await browser.close();
        io.emit("work-process", { data: null });
        return false;
      }

      io.emit("work-process", { data: "Working..." });
      let results = await page.evaluate(() => {
        return [...document.querySelectorAll(".c-posts.c-posts--column li")]
          .filter((i) => i.querySelector(".c-posts__inner")?.href)
          .map((element) => {
            const article = {
              domain: "Global News",
              domain_icon_url: document.querySelector("link[rel='icon']")?.href,
              title: element.querySelector(".c-posts__headlineText")?.innerText,
              content_url: element.querySelector(".c-posts__inner")?.href,
              topic:
                element.querySelector(
                  ".c-posts__info.c-posts__info--right.c-posts__info--highlight"
                )?.innerText ?? "News",

              published_at: element
                .querySelectorAll(".c-posts__info")[1]
                ?.innerText.replace(/\(|\)/g, ""),
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
  globalnews,
};
