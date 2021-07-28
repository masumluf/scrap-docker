const axios = require("axios");
(async () => {
  try {
    let result = await axios({
      method: "GET",
      url: "http://ip-api.com/json/103.197.152.31",
    });
    if (result) {
      console.log(result.data);
    }
  } catch (e) {
    console.log(e);
  }
})();
