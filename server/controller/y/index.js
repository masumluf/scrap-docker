const puppeteer = require("puppeteer");
const fs = require("fs");
const { puppeteerCore } = require("../helper/core");
let page;
let finalResults = [];

async function yStarMain(_, res) {
  const browser = await puppeteer.launch({ headless: true });
  page = await browser.newPage();
  //const { page } = puppeteerCore();
  await page.setViewport({ width: 1200, height: 1500 });

  await page.goto("https://news.ycombinator.com/news", {
    waitUntil: "networkidle2",
  });
  async function paginate() {
    try {
      const nextClick = await page.$(".morelink");
      const ad = await page.$(".noti_wrap");
      if (nextClick) {
        console.log("pagination found");

        await Promise.all([page.click(".morelink")]);
        await collectData();
      } else {
        //console.log(finalResults);
        //console.log(finalResults);
      }
    } catch (e) {
      console.log("Pagination Error Found");
      //return res.status(422).json(false);
    }
  }

  function printData(values) {
    for (let value of values) {
      finalResults.push(value);
    }
  }

  async function collectData() {
    try {
      console.log("Data collection started");
      let results = await page.evaluate(() => {
        return [...document.querySelectorAll(".athing")].map((element) => ({
          title: element.querySelector(".storylink").innerText,
        }));
      });
      if (results.length === 0) {
        console.log("Scrapping finished");
        console.warn(finalResults);
        return res.status(422).json(false);
      }
      printData(results);
      await paginate();
    } catch (e) {
      console.log("Data collection Error Found");
      //await collectData();
    }
    // return results;
  }
  //console.log(results);
  try {
    let datas = await collectData();

    console.log(datas.length);
  } catch (e) {
    console.log("Selection Error Found");
  }
  console.log("recheck pagination");
  await collectData();
}

module.exports = {
  yStarMain,
};
