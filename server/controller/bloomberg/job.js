const { startBrowser, startPage } = require("../helper/browserHelper");
const { scrollPageToBottom } = require("../helper/core");
const { addData } = require("../authController");
const { sanitizeDate } = require("../helper/dateSanitize");
const Queue = require("better-queue");

let page;
let count = 0;
let q = null;
async function bloomberg(io) {
  const browser = await startBrowser();
  page = await startPage(browser);

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
      { concurrent: results.length }
    );

    for (let result of results) {
      q.push(result);
      // console.log(result);
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
            ".story-package-module__story.mod-story"
          ),
        ]
          .slice(16, 500)
          .map((element) => {
            const article = {
              domain: "bloomberg",
              domain_icon_url: document.querySelector(
                "link[rel='shortcut icon']"
              )?.href,
              title: element.querySelector(
                ".story-package-module__story__headline"
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
                ".story-package-module__story__headline"
              )?.innerText,
              body: element.querySelector(
                ".story-package-module__story__headline"
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
