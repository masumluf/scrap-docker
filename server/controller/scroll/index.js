const fs = require("fs");
const puppeteer = require("puppeteer");

function extractItems() {
  const extractedElements = document.querySelectorAll(
    ".infinite-scroll-component > div",
  );

  const items = [];
  for (let element of extractedElements) {
    items.push(element.querySelector("a").innerText);
  }
  return items;
}

async function scrapeInfiniteScrollItems(
  page,
  extractItems,
  itemTargetCount,
  scrollDelay = 1000,
) {
  let items = [];
  try {
    let previousHeight;
    while (items.length < itemTargetCount) {
      items = await page.evaluate(extractItems);

      previousHeight = await page.evaluate("document.body.scrollHeight");
      await page.evaluate("window.scrollTo(0, document.body.scrollHeight)");
      await page.waitForFunction(
        `document.body.scrollHeight > ${previousHeight}`,
      );
      await page.waitForTimeout(scrollDelay);
    }
  } catch (e) {
    console.log("error found");
    return [];
  }
  return items;
}

async function infinityScroll(req, res) {
  // Set up browser and page.
  console.log("starts collecting...");
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    timeout: 0,
  });
  const page = await browser.newPage();
  page.setViewport({ width: 1280, height: 926 });

  // Navigate to the demo page.
  await page.goto("https://fusionread.com/search-result/zigzag");

  // Scroll and extract items from the page.
  const items = await scrapeInfiniteScrollItems(page, extractItems, 2000);

  // Save extracted items to a file.

  if (items.length === 0) {
    return res.status(422).json(false);
  } else {
    fs.writeFileSync("./items.txt", items.join("\n") + "\n");
  }

  // Close the browser.
  await browser.close();
}

module.exports = infinityScroll;
