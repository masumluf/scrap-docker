const jsdom = require("jsdom");
const { JSDOM } = jsdom;
//const { document } = new JSDOM(`...`).window;

(async () => {
  let dom = await JSDOM.fromURL("https://www.huffpost.com/news/");

  const document = dom.window.document;
  // const imgEl =
  //   document
  //     ?.querySelector("meta[property='og:image']")
  //     ?.getAttribute("content") ?? "";

  const getAll = [...document.querySelectorAll(".c-mediacard")];

  // const author = document
  //   .querySelector("meta[name='parsely-author']")
  //   .getAttribute("content");

  // const body = document
  //   .querySelector("meta[property='og:description']")
  //   .getAttribute("content");

  const title = document
    .querySelector("meta[property='og:title']")
    .getAttribute("content");

  // const topic = document
  //   .querySelector("meta[name='lotame-bbg-topic']")
  //   .getAttribute("content");
  // console.log(imgEl, author, body, title, topic);

  const allMeta = document.querySelectorAll("meta");
  console.log(getAll);
})();
