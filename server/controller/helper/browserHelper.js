const puppeteer = require("puppeteer");

async function startBrowser() {
  let browser;
  //console.log(process.env.NODE_ENV);
  try {
    console.log("----------- Open the browser ------------");
    browser = await puppeteer.launch({
      // userDataDir: "../cache",
      //executablePath: "/usr/bin/chromium-browser",

      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--single-process",
        "--disable-gpu",
      ],
      ignoreDefaultArgs: ["--disable-extensions"],
      headless: true,
      timeout: 6000,
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
    await page.setExtraHTTPHeaders({
      "Accept-Language": "en-US,en;q=0.9",
    });
    await page.setUserAgent(
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36",
      // "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36"
    );
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
