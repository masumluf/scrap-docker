const { startBrowser, startPage } = require("../helper/browserHelper");
const { scrollPageToBottom } = require("../helper/core");
const { addData } = require("../authController");
const { sanitizeDate } = require("../helper/dateSanitize");
const Queue = require("better-queue");

let page;
let count = 0;
let q = null;

async function ctv(io) {
  const browser = await startBrowser();
  page = await startPage(browser);
  //const io = req.app.get("io");

  await page.goto("https://www.ctvnews.ca/canada", {
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
              document.querySelector(".image.top.imgTop img")?.src ||
              "https://beta.ctvnews.ca/national/canada/2020/11/19/1_5190896/_jcr_content/root/responsivegrid/image.coreimg.png/1605780259479/1-5190988.png";
            const body = document
              .querySelector(".container")
              ?.innerText.split("--")[1]
              .substring(0, 300);
            const reading_time = document.querySelector(".container")?.innerText
              .length;
            const topic = document.querySelector(".name")?.innerText;
            //const summary = document.querySelector(".name")?.innerText;
            const author_name = document.querySelector(".byline")?.innerText
              ? document.querySelector(".byline")?.innerText
              : document.querySelector(".bioLink")?.innerText;

            //const topic = document.querySelector(".text").innerText;
            return {
              images_url,
              body,
              summary: body,
              reading_time,
              topic,
              author_name,
            };
          } catch (error) {
            console.log(error);
          }
        });

        //result.published_at = sanitizeDate(result.published_at);
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
        return [...document.querySelectorAll("article")].map((element) => ({
          domain: "CTV News",
          domain_icon_url: document.querySelector(
            "link[rel='apple-touch-icon']"
          )?.href,
          title: element.querySelector("h3 a")?.innerText,
          content_url: element.querySelector("a")?.href,
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
  ctv,
};
