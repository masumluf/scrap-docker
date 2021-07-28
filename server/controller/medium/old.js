const { startBrowser, startPage } = require("../helper/browserHelper");
const { scrollPageToBottom } = require("../helper/core");
const { addData } = require("../authController");
const { sanitizeDate } = require("../helper/dateSanitize");
const Queue = require("better-queue");
let page;

async function mediumOld(req, res) {
  let { topicName } = req.body;
  let count = 0;

  const browser = await startBrowser();
  page = await startPage(browser);
  const io = req.app.get("io");

  await page.goto(`https://medium.com/topic/${topicName}`, {
    waitUntil: "load",
    timeout: 0,
  });
  await scrollPageToBottom(page);
  await page.waitForTimeout(6000);

  async function navigateToNextTab(results) {
    const q = new Queue(
      async (data) => {
        await addData(data);
      },
      { concurrent: results.length }
    );

    for (let result of results) {
      try {
        // let style = result.images_url.style.backgroundImage;
        //
        result.images_url =
          "https://d1r109gkb6a3f4.cloudfront.net/domain-icon/medium.png";
        result.published_at = sanitizeDate(result.published_at);
        result.reading_time = parseInt(result.reading_time.split("")[0]) * 60;
        result.topic = topicName;
        // data storing to db
        //console.log(result);
        q.push(result);
      } catch (error) {
        console.log("navigation error", error);
      }
    }
  }

  async function paginate() {
    try {
      count++;
      console.log("pagination found...");
      console.log(count);

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

  async function collectData() {
    try {
      console.log("Data collection started");
      io.emit("work-process", { data: "Working..." });
      let results = await page.evaluate(() => {
        return [...document.querySelectorAll(".s > section")].map((element) => {
          //let img = element.querySelector(".s>a");
          //let img = element.querySelector(".s>a");

          const readAndPublished = element
            .querySelector(".n.cr")
            ?.textContent.split("·");
          let article = {
            domain: "medium",
            domain_icon_url: document.querySelector(
              "link[rel='apple-touch-icon']"
            )?.href,
            title: element.querySelector("h3")?.innerText,
            content_url: element.querySelector("h3 a")?.href,
            summary: element.querySelector("div.s > h3")?.innerText,
            body: element.querySelector("div.s > h3")?.innerText,

            published_at: readAndPublished[0],
            reading_time: readAndPublished[1],
            author_name:
              element.querySelector("div.aq > a")?.innerText ?? "medium",
            // images_url: element.querySelector(".go.s.g>a"),
            content_type: "article",
          };
          element.remove();
          return article;
        });
      });
      //console.log(results);
      if (results.length === 0) {
        console.log("Scrapping finished");
        await page.close();
        await browser.close();
        io.emit("work-process", { data: null });
        return res.status(422).json(false);
      }

      await navigateToNextTab(results);
      await paginate();
      io.emit("work-process", { data: null });
      console.log(results);
    } catch (e) {
      console.log("error found", e);
    }
  }
  console.log("recheck pagination");
  await collectData();
}

module.exports = {
  mediumOld,
};
