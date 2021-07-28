const { startBrowser, startPage } = require("../helper/browserHelper");
const { scrollPageToBottom } = require("../helper/core");
const { addData } = require("../authController");
const { sanitizeDate } = require("../helper/dateSanitize");
const Queue = require("better-queue");
let page;

async function bucketlistly(req, res) {
  let count = 0;
  const browser = await startBrowser();
  page = await startPage(browser);
  const io = req.app.get("io");

  await page.goto("https://www.bucketlistly.blog", {
    waitUntil: "networkidle2",
  });
  await scrollPageToBottom(page);
  await page.waitForTimeout(2000);

  async function paginate() {
    try {
      const nextClick = await page.$("#content ul > li.next");
      if (nextClick) {
        count++;
        console.log("pagination found...");
        console.log(count);
        await Promise.all([page.click("#content ul > li.next")]);
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
          timeout: 0,
        });

        console.log("collecting data from next tab..");
        const singleData = await newTab.evaluate(async () => {
          try {
            return {
              reading_time: document.querySelector(".post_body")?.innerText?.length || 400,
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
          ...document.querySelectorAll("div.row > a:not(.featured_post)"),
        ].map((element) => {
          const authorAndDate = element.querySelector(".headline > p")?.innerText.split("on");
          return {
            domain: "bucketlistly",
            domain_icon_url: document.querySelector("link[rel='shortcut icon']")?.href,
            title: element.querySelector(".header-1")?.innerText,
            content_url: element?.href,
            images_url: element.querySelector("picture img")?.src ?? "",
            topic: element.querySelector(".headline > .special-title")?.innerText,
            author_name: authorAndDate[0].split("By")[1].trim() ?? "bucketlistly",
            published_at: authorAndDate[1].trim(),
            summary: element.querySelector(".header-2")?.innerText,
            body: element.querySelector(".header-2")?.innerText,
            content_type: "article"
          }
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
      console.log("Data collection Error Found",e);
    }
  }

  console.log("recheck pagination");
  await collectData();
}

module.exports = {
  bucketlistly,
};
