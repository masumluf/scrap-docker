const puppeteer = require("puppeteer");
const { puppeteerCore } = require("../helper/core");
let page;
let finalResults = [];

async function dailyStarMain() {
  let count = 0;
  const browser = await puppeteer.launch({ headless: true });
  page = await browser.newPage();
  //const { page } = puppeteerCore();
  await page.setViewport({ width: 1200, height: 800 });

  await page.goto("https://www.thedailystar.net/online", {
    waitUntil: "networkidle2",
  });

  async function getFavIcon() {
    // let link = document.querySelectorAll("link");
    // for (let i of link) {
    //   if (i.getAttribute("rel") == "shortcut icon") {
    //     console.log(i.getAttribute("href"));
    //     console.log(window.location.host);
    //   }
    // }

    let fav = await page.$$eval("link", (el) => {
      for (let x of el) {
        if (x.getAttribute("rel") == "shortcut icon") {
          return x.getAttribute("href");
          //console.log(window.location.host);
        }
      }
    });

    return fav;
  }

  function printData() {
    return finalResults;
  }

  async function navigateToNextTab(results) {
    for (let result of results) {
      const newTab = await browser.newPage();

      await newTab.goto(result.link, {
        waitUntil: "domcontentloaded",
        timeout: 60000,
      });

      console.log("collecting data from next tab..");

      const singleData = await newTab.evaluate(async () => {
        return {
          published_at: document
            .querySelector(".small-text")
            .innerText.split("/")[0],
          reading_time: document.querySelector(".detailed-content").innerText
            .length,
          author_name: "Dailystar",
        };
      });

      //finalResults.push({ ...result, ...singleData });
      // {...result,...singleData}
      console.log({
        ...result,
        ...singleData,
        domain_icon_url: await getFavIcon(),
      });

      await newTab.close();
    }
  }

  async function paginate() {
    const nextClick = await page.$(".pager-show-more-next  a");
    // const ad = await page.$(".noti_wrap");

    if (nextClick) {
      console.log("pagination found");
      //++count;
      await Promise.all([
        //page.waitForSelector(".list-border li"),
        page.click(".pager-show-more-next  a"),
      ]);
      await collectData();
    } else {
      console.log(await getFavIcon());
      //console.log(finalResults);
    }
  }

  async function collectData() {
    try {
      console.log("Data collection started");
      //io.emit("work-process", { data: "Working..." });
      let results = await page.evaluate(() => {
        return [...document.querySelectorAll(".list-border li")].map(
          (element) => ({
            title: element.querySelector("h4").innerText,
            link: element.querySelector(".pad-bottom-small a").href,
            img: element.querySelector("img").getAttribute("src"),
            body: element.querySelector("p").innerText,
            summary: element.querySelector("p").innerText,
          })
        );
      });
      await navigateToNextTab(results);
      //printData(results);
      await paginate();
    } catch (e) {
      console.log("Data Error found");
      await collectData();
    }
  }
  //console.log(results);
  // let datas = await collectData();
  // for (let element of datas) {
  //   console.log(element);
  //   // console.log(element.querySelector("h4").innerText);
  //   // console.log(element.querySelector("img"));
  //   // console.log(element.querySelector("p").innerText);
  //   //element.remove();
  // }
  console.log("recheck pagination");
  await collectData();
}

module.exports = {
  dailyStarMain,
};
