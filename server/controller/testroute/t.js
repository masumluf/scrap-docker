const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch({ headless: false, timeout: 6000 });
  const page = await browser.newPage();
  await page.goto(
    "https://www.thestar.com/news/gta/2021/07/11/oh-i-dont-feel-safe-at-all-toronto-community-housing-residents-call-for-solutions-to-frequent-gun-violence.html"
  );
  await page.screenshot({ path: "example.png" });

  //await browser.close();
})();
