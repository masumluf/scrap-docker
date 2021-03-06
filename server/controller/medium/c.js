const { startBrowser, startPage } = require("../helper/browserHelper");
const { scrollPageToBottom } = require("../helper/core");
const { addData } = require("../authController");
const { sanitizeDate } = require("../helper/dateSanitize");
const Queue = require("better-queue");
let page;
let count = 0;
let q = null;

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

(async () => {
  const browser = await startBrowser();
  page = await startPage(browser);

  await page.goto("https://medium.com/", {
    waitUntil: "load",
    timeout: 0,
  });
  //await scrollPageToBottom(page);
  await page.waitForTimeout(6000);
})();
