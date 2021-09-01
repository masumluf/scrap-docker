const jsdom = require("jsdom");
const { addData } = require("../authController");
const { JSDOM } = jsdom;

exports.scrapperWithTopic = async (obj) => {
  try {
    console.log("WithTopic", obj.content_url);

    let dom = await JSDOM.fromURL(`${obj.content_url}`);

    const document = dom.window.document;
    const images_url =
      document
        ?.querySelector("meta[property='og:image']")
        ?.getAttribute("content") ?? "";

    const author =
      document?.querySelector(`${obj.author}`)?.getAttribute("content") ?? "";

    const body =
      document
        ?.querySelector("meta[property='og:description']")
        ?.getAttribute("content") ?? "";

    const title =
      document
        ?.querySelector("meta[property='og:title']")
        ?.getAttribute("content") ?? "";

    const topic =
      document?.querySelector(`${obj.topic}`)?.getAttribute("content") ?? "";

    const tag =
      document?.querySelector(`${obj.tag}`)?.getAttribute("content") ?? "";

    const published_at =
      document?.querySelector(`${obj.published_at}`)?.getAttribute("content") ??
      "";

    const reading_time = null;

    if (obj.reading_time) {
      reading_time =
        document
          ?.querySelector(`${obj.reading_time}`)
          ?.getAttribute("content") ?? "";
    }

    console.log(
      images_url,
      "<>",
      author,
      "<>",
      body,
      "<>",
      title,
      "<>",
      topic,
      "<>",
      tag,
      "<>",
      published_at,
    );
  } catch (e) {
    console.log(obj.content_url);
  }
  //console.log(imgEl, author, body, title, topic);
};

exports.scrapperWithTagCode = async (obj) => {
  try {
    console.log("WithCode", obj.content_url);

    let dom = await JSDOM.fromURL(`${obj.content_url}`);

    const document = dom.window.document;
    const images_url =
      document?.querySelector(`${obj.images_url}`)?.getAttribute("content") ??
      "";

    const author =
      document?.querySelector(`${obj.author_name}`)?.getAttribute("content") ??
      "";

    const body =
      document?.querySelector(`${obj.body}`)?.getAttribute("content") ?? "";

    const title =
      document?.querySelector(`${obj.title}`)?.getAttribute("content") ?? "";

    const topic =
      document?.querySelector(`${obj.topic}`)?.getAttribute("content") ?? "";

    const tag =
      document?.querySelector(`${obj.tag}`)?.getAttribute("content") ?? "";

    const published_at =
      document?.querySelector(`${obj.published_at}`)?.getAttribute("content") ??
      Date.now();

    const reading_time = null;

    if (obj.reading_time) {
      reading_time =
        document
          ?.querySelector(`${obj.reading_time}`)
          ?.getAttribute("content") ?? "";
    }

    if (!title && !images_url) {
      console.log("Bad Item....");
      return false;
    }

    console.log(
      images_url,
      "<>",
      author,
      "<>",
      body,
      "<>",
      title,
      "<>",
      topic,
      "<>",
      tag,
      "<>",
      published_at,
      "<>",
      reading_time,
    );
  } catch (e) {
    console.log(obj.content_url);
  }
  //console.log(imgEl, author, body, title, topic);
};

exports.scrapperWithTagCodeWithOutGetAttribute = async (obj) => {
  try {
    //console.log("WithCode", obj);

    let topic = null;

    let dom = await JSDOM.fromURL(`${obj.content_url}`);

    const document = dom.window.document;
    const images_url =
      document
        ?.querySelector(`${obj.images_url_tag}`)
        ?.getAttribute("content") ?? "";

    const author_name =
      document?.querySelector(`${obj.authorTag}`)?.innerHTML ?? obj.domain;

    const title = document?.querySelector(`${obj.titleTag}`)?.innerHTML;
    const body = document
      .querySelector(`${obj?.bodyTag}`)
      ?.getAttribute("content");

    if (!obj?.topic) {
      topic = document?.querySelector(`${obj.topicTag}`)?.innerHTML ?? "";
    }

    const tag =
      document?.querySelector(`${obj.tagTag}`)?.getAttribute("content") ?? [];

    const published_at = Date.now();

    let reading_time = null;

    if (!obj.reading_time) {
      reading_time =
        document?.querySelector(`${obj.readingTag}`)?.innerHTML.length || 400;
    }

    if (!title && !images_url) {
      console.log("Bad Item....");
      return false;
    }
    console.log(images_url, title);

    await addData({
      ...obj,
      title,
      images_url,
      author_name,
      topic,
      tag,
      body,
      summary: body,
      published_at,
      reading_time,
    });
  } catch (e) {
    console.log(e, obj.content_url);
  }
  //console.log(imgEl, author, body, title, topic);
};

exports.scrapperWithTagCodeWithOutGetAttributeTopic = async (obj) => {
  try {
    //console.log("WithCode", obj);

    let topic = null;

    let dom = await JSDOM.fromURL(`${obj.content_url}`);

    const document = dom.window.document;
    const images_url =
      document
        ?.querySelector(`${obj.images_url_tag}`)
        ?.getAttribute("content") ?? "";

    const author_name =
      document?.querySelector(`${obj.authorTag}`)?.innerHTML ?? obj.domain;

    const title = document?.querySelector(`${obj.titleTag}`)?.innerHTML;
    const body = document
      .querySelector(`${obj?.bodyTag}`)
      ?.getAttribute("content");

    if (!obj?.topic) {
      topic =
        document?.querySelector(`${obj.topicTag}`)?.getAttribute("content") ??
        "";
    }

    const tag =
      document?.querySelector(`${obj.tagTag}`)?.getAttribute("content") ?? [];

    const published_at = Date.now();

    let reading_time = null;

    if (!obj.reading_time) {
      reading_time =
        document?.querySelector(`${obj.readingTag}`)?.innerHTML.length || 400;
    }

    if (!title && !images_url) {
      console.log("Bad Item....");
      return false;
    }
    console.log(images_url, title);

    await addData({
      ...obj,
      title,
      images_url,
      author_name,
      topic,
      tag,
      body,
      summary: body,
      published_at,
      reading_time,
    });
  } catch (e) {
    console.log(e, obj.content_url);
  }
  //console.log(imgEl, author, body, title, topic);
};

exports.scrapperWithTagCodeWithOutGetAttributeAndContent = async (obj) => {
  try {
    //console.log("WithCode", obj);

    let dom = await JSDOM.fromURL(`${obj.content_url}`);

    const document = dom.window.document;
    const images_url =
      document
        ?.querySelector("meta[property='og:image']")
        ?.getAttribute("content") ?? "";

    const author_name =
      document?.querySelector(`${obj.authorTag}`)?.innerHTML ?? obj.domain;

    const title = document?.querySelector(`${obj.titleTag}`)?.innerHTML;
    const body = document.querySelector(`${obj?.bodyTag}`)?.innerText;
    const topic = document.querySelector(`${obj?.topicTag}`)?.innerText;

    const tag =
      document
        .querySelector(`${obj.tagTag}`)
        ?.innerText.split("\n")[1]
        .split(" ") ?? [];

    const published_at = Date.now();

    const reading_time =
      document?.querySelector(`${obj.bodyTag}`)?.innerHTML.length || 400;

    if (!title && !images_url) {
      console.log("Bad Item....");
      return false;
    }
    console.log(images_url, title);

    await addData({
      ...obj,
      title,
      images_url,
      author_name,
      topic,
      tag,
      body,
      summary: body,
      published_at,
      reading_time,
    });
  } catch (e) {
    console.log(e, obj.content_url);
  }
  //console.log(imgEl, author, body, title, topic);
};

exports.scrapperWithTagCodeTest = async (obj) => {
  try {
    console.log(obj);
  } catch (e) {
    console.log(obj.content_url);
  }
  //console.log(imgEl, author, body, title, topic);
};
