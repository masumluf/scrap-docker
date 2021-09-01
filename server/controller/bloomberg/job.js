const { startBrowser, startPage } = require("../helper/browserHelper");
const { scrollPageToBottom } = require("../helper/core");
const { addData } = require("../authController");
const { sanitizeDate } = require("../helper/dateSanitize");
const Queue = require("better-queue");
const { scrapperWithTopic } = require("../helper/dataScrapper");

let page;
let count = 0;
let q = null;
async function bloomberg(io) {
  const browser = await startBrowser();
  page = await startPage(browser);

  await page.setRequestInterception(true);

  page.on("request", (request) => {
    if (request.resourceType() === "script") {
      request.abort();
    } else {
      request.continue();
    }
  });

  await page.goto("https://www.bloomberg.com/", {
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
      { concurrent: results.length },
    );

    for (let result of results) {
      //q.push(result);
      // console.log(result);
      const newTab = await startPage(browser);
      await newTab.goto(result.content_url, {
        waitUntil: "domcontentloaded",
        timeout: 0,
      });
      const singleData = await newTab.evaluate(async () => {
        try {
          console.log("inside the page");
        } catch (error) {
          console.log(error);
        }
      });
      console.log(await page.content());
      await scrapperWithTopic(result);
      await newTab.waitForTimeout(2000);
      await newTab.close();
    }
  }

  async function collectData() {
    try {
      io.emit("work-process", { data: "Schedule Job Starts..." });
      // await page.evaluate(() => {
      //   document.querySelector(".navi-edition.noscript-hide a").click();
      // });
      // let findCategory = [
      //   ...document.querySelectorAll(
      //     ".navi-edition__dropdown.navi-edition__dropdown--show li"
      //   ),
      // ].find(
      //   (item) =>
      //     item.querySelector("a").getAttribute("data-edition-code") === "AMER"
      // );
      // // const nextClick = await page.$("");
      //
      // await page.evaluate(() => {
      //   findCategory.click();
      // });

      // if (count > 5) {
      //   await page.close();
      //   await browser.close();
      //   io.emit("work-process", { data: null });
      //   return false;
      // }
      let results = await page.evaluate(() => {
        return [
          ...document.querySelectorAll(
            ".story-package-module__story.mod-story",
          ),
        ]
          .slice(16, 500)
          .map((element) => {
            const article = {
              domain: "bloomberg",
              domain_icon_url: document.querySelector(
                "link[rel='shortcut icon']",
              )?.href,
              title: element.querySelector(
                ".story-package-module__story__headline",
              )?.innerText,
              content_url: element.querySelector("h3 a")?.href,
              images_url:
                element.querySelector("img")?.src ??
                "https://mma.prnewswire.com/media/649927/Bloomberg_Logo.jpg?p=facebook",
              topic:
                element
                  .querySelector(".story-package-module__story__eyebrow")
                  ?.innerText.trim() ?? "News",
              summary: element.querySelector(
                ".story-package-module__story__headline",
              )?.innerText,
              body: element.querySelector(
                ".story-package-module__story__headline",
              )?.innerText,
              content_type: "news",
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
        return false;
      }

      await navigateToNextTab(results);
      //await paginate();
    } catch (e) {
      console.log("error found", e);
      await collectData();
    }
  }
  console.log("recheck pagination...");
  await collectData();
}

module.exports = {
  bloomberg,
};
