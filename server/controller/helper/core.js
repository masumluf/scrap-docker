/**
 * Scrolling page to bottom based on Body element
 * @param {Object} page Puppeteer page object
 * @param {Number} scrollStep Number of pixels to scroll on each step
 * @param {Number} scrollDelay A delay between each scroll step
 */
async function scrollPageToBottom(page, scrollStep = 100, scrollDelay = 100) {
  const height = await page.evaluate(`document.body.scrollHeight`);
  for (let i = scrollStep; i < height; i += scrollStep) {
    await page.evaluate(`window.scrollTo(0,${i})`);
    await page.waitForTimeout(scrollDelay);
  }
}

/**
 * Scrolling page to bottom based on Body element
 * @param {Object} page Puppeteer page object
 * @param {Number} scrollStep Number of pixels to scroll on each step
 * @param {Number} scrollDelay A delay between each scroll step
 * @returns {Number} Last scroll position
 */
async function scrollPageToBottom2(page, scrollStep = 100, scrollDelay = 100) {
  const lastPosition = await page.evaluate(
    async (step, delay) => {
      const getScrollHeight = (element) => {
        if (!element) return 0;

        const { scrollHeight, offsetHeight, clientHeight } = element;
        return Math.max(scrollHeight, offsetHeight, clientHeight);
      };

      const position = await new Promise((resolve) => {
        let count = 0;
        const intervalId = setInterval(() => {
          const { body } = document;
          const availableScrollHeight = getScrollHeight(body);

          window.scrollBy(0, step);
          count += step;

          if (count >= availableScrollHeight) {
            clearInterval(intervalId);
            resolve(count);
          }
        }, delay);
      });

      return position;
    },
    scrollStep,
    scrollDelay
  );
  return lastPosition;
}

module.exports = { scrollPageToBottom, scrollPageToBottom2};