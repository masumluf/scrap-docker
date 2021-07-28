const { startBrowser, startPage } = require("../helper/browserHelper");
const { scrollPageToBottom } = require("../helper/core");
const { addData } = require("../authController");
const { sanitizeDate } = require("../helper/dateSanitize");
const Queue = require("better-queue");
const puppeteer = require("puppeteer");
const iPhone = puppeteer.devices["iPhone 6"];
let page;
let count = 0;
let q = null;

(async () => {
  const browser = await startBrowser();
  page = await startPage(browser);
  await page.emulate(iPhone);
  await page.goto("https://www.theguardian.com/us-news/all", {
    waitUntil: "networkidle2",
  });

  await scrollPageToBottom(page);
  await page.waitForTimeout(2000);

  //await page.click('[data-test-id="accept-cookie"]');

  //await page._client.send("Network.getAllCookies");

  await page.waitForSelector(".message-component.message-button.no-children");
  await page.click(".message-component.message-button.no-children");

  const nextClick = await page.$(".is-active");

  const newNext = await page.$(".is-active + a");
  //console.log(nextClick);
  if (newNext) {
    console.log("pagination found...");
    //console.log(newNext);
    let newSelector = nextClick.nextElementSibling;
    //await page.click(".is-active + a");
    //newNext.click();
    await Promise.all([page.click(".is-active + a")]);
  }

  console.log("recheck pagination");
})();
