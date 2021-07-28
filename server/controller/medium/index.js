const { startBrowser, startPage } = require("../helper/browserHelper");
const { scrollPageToBottom } = require("../helper/core");
const { addData } = require("../authController");
const { sanitizeDate } = require("../helper/dateSanitize");
const Queue = require("better-queue");
let page;

let str = [
  "Art",
  "Books",
  "Comics",
  "Fiction",
  "Film",
  "Gaming",
  "Humor",
  "Music",
  "Nonfiction",
  "Photography",
  "Podcasts",
  "Poetry",
  "TV",
  "Visual Design",
  "Culture",
  "Food",
  "Language",
  "Makers",
  "Outdoors",
  "Pets",
  "Philosophy",
  "Sports",
  "Style",
  "Travel",
  "True Crime",
  "Accessibility",
  "Disability",
  "Equality",
  "Feminism",
  "LGBTQIA",
  "Race",
  "Addiction",
  "Coronavirus",
  "Fitness",
  "Health",
  "Mental Health",
  "Business",
  "Design",
  "Economy",
  "Freelancing",
  "Leadership",
  "Marketing",
  "Media",
  "Product Management",
  "Remote Work",
  "Startups",
  "UX",
  "Venture Capital",
  "Work",
  "Creativity",
  "Mindfulness",
  "Money",
  "Productivity",
  "Writing",
  "Gun Control",
  "Immigration",
  "Justice",
  "Politics",
  "Android Dev",
  "Data Science",
  "iOS Dev",
  "Javascript",
  "Machine Learning",
  "Programming",
  "Software Engineering",
  "Biotech",
  "Climate Change",
  "Math",
  "Neuroscience",
  "Psychology",
  "Science",
  "Space",
  "Astrology",
  "Beauty",
  "Family",
  "Lifestyle",
  "Parenting",
  "Relationships",
  "Self",
  "Sexuality",
  "Spirituality",
  "Basic Income",
  "Cannabis",
  "Cities",
  "Education",
  "History",
  "Psychedelics",
  "Religion",
  "San Francisco",
  "Social Media",
  "Society",
  "Transportation",
  "World",
  "Artificial Intelligence",
  "Blockchain",
  "Cryptocurrency",
  "Cybersecurity",
  "Digital Life",
  "Future",
  "Gadgets",
];

async function medium(req, res) {
  let count = 0;
  const browser = await startBrowser();
  page = await startPage(browser);
  const io = req.app.get("io");

  await page.goto("https://medium.com/", {
    waitUntil: "load",
    timeout: 0,
  });
  await scrollPageToBottom(page);
  await page.waitForTimeout(6000);

  async function navigateToNextTab(results) {
    const q = new Queue(
      async (data) => {
        await addData(data);
      },
      { concurrent: results.length }
    );

    for (let result of results) {
      try {
        result.published_at = sanitizeDate(result.published_at);
        result.reading_time = parseInt(result.reading_time.split("")[0]) * 60;
        result.topic = str[Math.floor(Math.random() * 99)];
        // data storing to db
        q.push(result);
        //console.log(result);
      } catch (error) {
        console.log("navigation error", error);
      }
    }
  }

  async function paginate() {
    try {
      count++;
      console.log("pagination found...");
      console.log(count);
      await page.waitForTimeout(6000);
      await scrollPageToBottom(page);
      await page.waitForTimeout(6000);
      await collectData();
    } catch (e) {
      console.log("Pagination Error Found", e);
      await page.close();
      await browser.close();
      io.emit("work-process", { data: null });
      return res.status(422).json(false);
    }
  }

  async function collectData() {
    try {
      console.log("Data collection started");
      io.emit("work-process", { data: "Working..." });
      let results = await page.evaluate(() => {
        return [...document.querySelectorAll(".aj.dn")]
          .slice(1, [...document.querySelectorAll(".aj.dn")].length - 1)
          .map((element) => {
            let article = {
              domain: "medium",
              domain_icon_url: document.querySelector(
                "link[rel='apple-touch-icon']"
              )?.href,
              title: element.querySelector("div")?.querySelector("h2")
                ?.innerText,
              content_url: element.querySelector("div").querySelector("h2")
                ?.parentElement?.href,
              summary: element.querySelector("div").querySelector("h3")
                ? element.querySelector("div").querySelector("h3")?.innerText
                : "Nothing Found",
              body: element.querySelector("div").querySelector("h3")
                ? element.querySelector("div").querySelector("h3")?.innerText
                : "Nothing Found",

              reading_time: element.querySelector("span:nth-child(3)")
                ?.innerText,
              published_at: element.querySelector("div").querySelector("span")
                ?.innerText,
              author_name:
                element.querySelector("div").querySelector("h4")?.innerText ??
                "medium",
              images_url:
                element.querySelector("div").querySelector("img")?.src ?? "",
              content_type: "article",
            };

            element.remove();
            return article;
          });
      });
      //console.log(results);
      if (results.length === 0) {
        console.log("Scrapping finished");
        await page.close();
        await browser.close();
        io.emit("work-process", { data: null });
        return res.status(422).json(false);
      }

      await navigateToNextTab(results);
      await paginate();
    } catch (e) {
      console.log("error found", e);
    }
  }
  console.log("recheck pagination");
  await collectData();
}

module.exports = {
  medium,
};
