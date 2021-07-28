exports.readTime = (textLength) => {
  const wordsPerMinute = 500;
  let result;
  if (textLength > 0) {
    let value = Math.ceil(textLength / wordsPerMinute);
    result = Math.floor(value * 60);
  }
  return result;
};
