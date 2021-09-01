const jsdom = require("jsdom");
const { JSDOM } = jsdom;

(async () => {
  let titleTag = "title";
  let descriptionTag = "meta[name='description']";

  let doc = await JSDOM.fromURL(
    "https://financialpost.com/commodities/energy/oil-gas/time-to-rein-in-the-dangerous-greenhouse-gas-that-has-slipped-through-the-cracks-of-canadas-ambitious-net-zero-masterplan",
  );

  let document = doc.window.document;

  let title = document.querySelector(titleTag)?.innerHTML;
  let body = document.querySelector(descriptionTag)?.getAttribute("content");

  console.log(title, body);
})();
