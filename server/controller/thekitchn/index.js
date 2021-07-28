const { startBrowser, startPage } = require("../helper/browserHelper");
const { scrollPageToBottom2 } = require("../helper/core");
const { addData } = require("../authController");
const { sanitizeDate } = require("../helper/dateSanitize");
const Queue = require("better-queue");
let page;

async function preparePageForTests(page) {
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, "webdriver", {
      get: () => false,
    });
  });
}

async function thekitchn(req, res) {
  const browser = await startBrowser();
  page = await startPage(browser);
  await preparePageForTests(page);
  const io = req.app.get("io");

  await page.goto("https://www.thekitchn.com", { waitUntil: "networkidle2" });

  async function navigateToNextTab(recipeLinks) {
    for (let link of recipeLinks) {
      let newTab;
      try {
        newTab = await startPage(browser);
        await preparePageForTests(newTab);
        await newTab.goto(link, {
          waitUntil: "domcontentloaded",
          timeout: 0,
        });
        await scrollPageToBottom2(newTab);
        await page.waitForTimeout(2000);

        console.log("collecting data from next tab..");
        let results;
        try {
          results = await newTab.evaluate(() => {
            return [...document.querySelectorAll(".Spread__item--teaser")].map(
              (element) => {
                return {
                  domain: "thekitchn",
                  domain_icon_url: document.querySelector("link[rel='shortcut icon']")?.href,
                  title: element.querySelector(".Teaser__headline")?.innerText,
                  content_url: element.querySelector(".Teaser__headline")?.href,
                  topic: element.querySelector(".Teaser__kicker")?.innerText,
                  author_name: element.querySelector(".Teaser__byline")?.innerText ??
                    "thekitchn",
                  images_url: element.querySelector("picture img")?.src ?? "",
                  published_at: element.querySelector(".Teaser__timestamp")?.innerText,
                  summary: element.querySelector(".Teaser__dek")?.innerText,
                  body: element.querySelector(".Teaser__dek")?.innerText,
                  content_type: "article",
                };
              }
            );
          });
        } catch (e) {
          console.log("error found", e);
        }

        const q = new Queue(
          async (data) => {
            await addData(data);
          },
          { concurrent: results.length }
        );
        for (let result of results) {
          try {
            await newTab.goto(result.content_url, {waitUntil: "networkidle2" });
            const singleData = await newTab.evaluate(() => {
              return {
                reading_time: document.querySelector("article.Post")?.innerText?.length || 400,
              };
            });
            result.published_at = sanitizeDate(result.published_at);
            // data storing to db
            q.push({
              ...result,
              ...singleData,
            });
          } catch (error) {
            console.log("3rd page error", error);
          }
        }
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
      io.emit("work-process", { data: "Working..." });
      let recipeLinks = await page.evaluate(() => {
        const ulLink = document.querySelector("ul.SiteHeaderNavBlock__section-links");
        const recipeLinks = Array.from(ulLink.querySelectorAll("li a")).map((ele) => ele.href);
        return recipeLinks;
      });
      await navigateToNextTab(recipeLinks);
    } catch (e) {
      console.log("error found", e);
    }

    console.log("Scrapping finished");
    await page.close();
    await browser.close();
    io.emit("work-process", { data: null });
    return res.status(422).json(false);
  }
  console.log("recheck pagination");
  await collectData();
}

module.exports = {
  thekitchn,
};
