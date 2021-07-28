const { startBrowser, startPage } = require("../helper/browserHelper");
const { scrollPageToBottom } = require("../helper/core");
const { addData } = require("../authController");
const { sanitizeDate } = require("../helper/dateSanitize");
const Queue = require("better-queue");

let page;
let count = 0;
let q = null;

async function cnn(io) {
  const browser = await startBrowser();
  page = await startPage(browser);
  //const io = req.app.get("io");

  await page.goto("https://edition.cnn.com/", {
    waitUntil: "networkidle2",
  });
  await scrollPageToBottom(page);
  await page.waitForTimeout(2000);

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
      // console.log(result?.content_url);
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
            const regexBody = /(<([^>]+)>)|\n|\t|\s{2,}|"|'/gi;
            const images_url =
              document.querySelector(".zn-body-text img")?.src ||
              "https://cdn.cnn.com/cnn/.e/img/3.0/global/misc/cnn-logo.png";
            const body = document
              .querySelector(".zn-body-text")
              ?.innerText.substring(0, 300);
            const reading_time = document.querySelector(".zn-body-text")
              ?.innerText.length;
            //const topic = document.querySelector(".text").innerText;
            return {
              images_url,
              body,
              summary: body,
              reading_time,
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
      io.emit("work-process", { data: "Schedule Job Starts..." });
      if (count > 5) {
        await page.close();
        await browser.close();
        io.emit("work-process", { data: null });
        console.log("Finished..");
        return false;
      }
      let results = await page.evaluate(() => {
        return [...document.querySelectorAll(".cd__wrapper")]
          .slice(8, 200)
          .map((element) => ({
            domain: "cnn",
            domain_icon_url: document.querySelector(
              "link[rel='apple-touch-icon']"
            )?.href,
            title: element.querySelector(".cd__headline-text.vid-left-enabled")
              ?.innerText,
            content_url: element.querySelector("a")?.href,
            topic:
              element.getAttribute("data-analytics").split("_")[0].trim() ??
              "Top Story",

            content_type: "news",
          }));
      });
      if (results.length === 0) {
        console.log("Scrapping finished");
        await page.close();
        await browser.close();
        io.emit("work-process", { data: null });
        return false;
      }

      await navigateToNextTab(results);

      //await paginate();
    } catch (e) {
      console.log("error found", e);
      await collectData();
    }
  }
  console.log("recheck pagination");
  await collectData();
}

module.exports = {
  cnn,
};
