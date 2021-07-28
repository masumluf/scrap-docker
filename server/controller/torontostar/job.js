const { startBrowser, startPage } = require("../helper/browserHelper");
const { scrollPageToBottom } = require("../helper/core");
const { addData } = require("../authController");
const { sanitizeDate } = require("../helper/dateSanitize");
const Queue = require("better-queue");

let page;
let count = 0;
let q = null;

async function toronto(io) {
  const browser = await startBrowser();
  page = await startPage(browser);
  //const io = req.app.get("io");

  await page.goto("https://www.thestar.com/", {
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
            await page.waitForTimeout(3000);
            const regexBody = /(<([^>]+)>)|\n|\t|\s{2,}|"|'/gi;
            const title = document.querySelector(
              ".c-article-headline__heading.c-article-headline__heading--long"
            )?.innerText;
            const images_url =
              document.querySelector(".image__body.white-background img")
                ?.src ||
              "http://sun9-1.userapi.com/s/v1/if1/M3BmPQFtz4nwFvyv6SgPBtFBfxbr1s1MLtccLtspvy9kS93KpcXcCLpOOenStnZGZgu89g.jpg?size=200x0&quality=96&crop=0,0,300,300&ava=1";
            const body = document.querySelector(
              ".c-article-body__content.locked-article"
            )?.innerText;
            // const reading_time =
            //   parseInt(
            //     document
            //       .querySelector(".article__readtime span")
            //       ?.innerText.split(" ")[0]
            //   ) * 20;
            const topic = document.querySelector(".text").innerText;
            const author_name = document.querySelector(".article__author-name")
              ?.innerText;
            // const published_at = sanitizeDate(
            //   document
            //     .querySelector(".article__published-date")
            //     ?.innerText.split(",")
            //     .slice(1, 3)
            //     .join(",")
            //     .trim()
            // );

            return {
              title,
              published_at,
              topic,
              images_url,
              body,
              author_name,
              summary: body,
              reading_time,
            };
          } catch (error) {
            console.log(error);
          }
        });

        //result.published_at = sanitizeDate(result.published_at);
        // data storing to db

        console.log(singleData);

        // q.push({
        //   ...result,
        //   ...singleData,
        // });
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
        return [...document.querySelectorAll("a")]
          .filter((i) => i?.innerText.length > 50)
          .map((element) => ({
            domain: "Toronto Star",
            domain_icon_url: document.querySelector(
              "link[rel='apple-touch-icon']"
            )?.href,
            content_url: element?.href,
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
  toronto,
};
