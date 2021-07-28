const puppeteer = require("puppeteer");
const fs = require("fs");
const scrollPageToBottom = require("./core");
let page;
let finalResults = [];
let count = 0;

async function fStarMain() {
  const browser = await puppeteer.launch({ headless: false });
  page = await browser.newPage();
  //const { page } = puppeteerCore();
  await page.setViewport({ width: 1200, height: 1500 });

  await page.goto("https://fusionread.com/search-result/bitcoin_hack", {
    waitUntil: "networkidle2",
  });
  async function paginate() {
    let count = 0;
    let nextClick = await page.$(".jss85");
    console.log(nextClick);
    if (!nextClick) {
      console.log(count);
      await scrollPageToBottom(page);

      // console.log("count increment");
      await collectData();
    } else {
      count = null;
    }

    //await page.waitFor(1000);
  }

  function printData(results) {
    // console.log("function trigggered");
    for (let value of results) {
      console.log(value);
    }
  }

  async function collectData() {
    console.log("Data collection started");
    count++;
    let results = await page.evaluate(() => {
      return [
        ...document.querySelectorAll(".infinite-scroll-component > div"),
      ].map((element) => ({
        title: element.querySelector("a").innerText,
      }));
    });
    //console.log(results);
    printData(results);
    await paginate();

    // return results;
  }
  //console.log(results);

  //console.log("recheck pagination");
  await collectData();
}

module.exports = fStarMain;
