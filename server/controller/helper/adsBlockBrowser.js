const puppeteer = require("puppeteer-extra");
const AdblockerPlugin = require("puppeteer-extra-plugin-adblocker");
puppeteer.use(AdblockerPlugin());

async function startBrowser() {
  let browser;
  try {
    console.log("----------- Open the browser ------------");
    browser = await puppeteer.launch({
      // userDataDir: "../cache",
      executablePath:
        process.env.NODE_ENV === "production"
          ? "/usr/bin/chromium-browser"
          : "",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
      headless: true,
    });
  } catch (err) {
    console.log("Could not create a browser instance => : ", err);
  }
  return browser;
}

async function startPage(browser) {
  let page;
  try {
    console.log("----------- Open a new page ------------");
    page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800 });
    // await page.setRequestInterception(true);
    // page.on("request", (req) => {
    //   if (req.resourceType() === "font" || req.resourceType() === "image") {
    //     req.abort();
    //   } else {
    //     req.continue();
    //   }
    // });
  } catch (err) {
    console.log("Could not create a new page => : ", err);
  }
  return page;
}

module.exports = {
  startBrowser,
  startPage,
};
