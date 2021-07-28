const { startBrowser, startPage } = require("../helper/browserHelper");
const { scrollPageToBottom } = require("../helper/core");
const { addData } = require("../authController");
const { sanitizeDate } = require("../helper/dateSanitize");
const Queue = require("better-queue");

let page;

async function cicnewsOld(req, res) {
  let { topicName } = req.body;
  let count = 0;

  const browser = await startBrowser();
  page = await startPage(browser);
  const io = req.app.get("io");

  await page.goto(`https://www.cicnews.com/category/${topicName}`, {
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
            const dateText = document.querySelector(".post_date_box .date")
              ?.innerText;
            const body = document
              .querySelector(".article_box")
              .innerText.replace(regexBody, " ");
            return {
              published_at: dateText
                .substring(dateText.indexOf("on") + 2, dateText.indexOf("at"))
                .replace(/st|nd|rd|th/g, "")
                .trim(),
              body: body.substring(0, 350),
              reading_time: body?.length || 400,
              topic: document.querySelectorAll(".tags ul li a")[0]?.innerText,
              author_name: document.querySelector(".author_name")?.innerText
                ? document.querySelector(".author_name")?.innerText
                : "CIC News",
            };
          } catch (error) {
            console.log(error);
          }
        });

        singleData.published_at = sanitizeDate(singleData.published_at);
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

  async function paginate() {
    try {
      const nextClick = await page.$("li a.next");
      if (nextClick) {
        count++;
        console.log("pagination found...");
        console.log(count);
        await Promise.all([page.click("li a.next")]);
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
    } catch (error) {
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
      let results = await page.evaluate(() => {
        return [...document.querySelectorAll(".article_list article")].map(
          (element) => ({
            domain: "cicnews",
            domain_icon_url: document.querySelector("link[rel='shortcut icon']")
              ?.href,
            title: element.querySelector("h3")?.innerText,
            content_url: element.querySelector("h3 a")?.href,

            images_url:
              element.querySelector("figure img")?.src ??
              element.querySelector("figure picture source")?.srcset ??
              "",
            summary: element.querySelector(".text p:nth-child(2)")?.innerText,
            content_type: "news",
          })
        );
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
    }
  }
  console.log("recheck pagination");
  await collectData();
}

module.exports = {
  cicnewsOld,
};
