const puppeteer = require("puppeteer");

const jsdom = require("jsdom");
const { JSDOM } = jsdom;

// (async () => {
//   const browser = await puppeteer.launch();
//   const page = await browser.newPage();
//   await page.goto(
//     "view-source:https://www.bloomberg.com/news/articles/2021-08-26/billionaire-donations-soar-in-china-push-for-common-prosperity?srnd=premium-asia",
//   );

//   await page.screenshot({ path: "example.png" });

//   console.log(await page.content());

//   await browser.close();
// })();

// (async () => {
//   try {
//     let dom = await JSDOM.fromURL(
//       "view-source:https://www.bloomberg.com/news/articles/2021-08-26/billionaire-donations-soar-in-china-push-for-common-prosperity?srnd=premium-asia",
//     );
//     const title =
//       document
//         ?.querySelector("meta[property='og:title']")
//         ?.getAttribute("content") ?? "";
//   } catch (e) {
//     console.log(e);
//   }
// })();
