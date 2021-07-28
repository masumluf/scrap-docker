let schedule = require("node-schedule");

let { aljazeera } = require("../aljazeera/job");
let { businessinsider } = require("../businessinsider/job");
let { cbc } = require("../cbc/job");
let { cicnews } = require("../cicnews/job");
let { cnet } = require("../cnet/job");
let { foxnews } = require("../foxnews/job");
let { medium } = require("../medium/job");
let { dev } = require("../dev/job");
let { nasa } = require("../nasa/job");

let { cnn } = require("../cnn/job");

let { redditblog } = require("../redditblog/job");
let { washingtonpost } = require("../washingtonpost/job");
let { bbc } = require("../bbc/job");

let { gurdian } = require("../gurdian/job");
let { nypost } = require("../nypost/job");
let { bloomberg } = require("../bloomberg/job");

let { ctv } = require("../ctv/job");
let { globalnews } = require("../globalnews/job");

let { toronto } = require("../torontostar/job");

exports.CheckExpressProduct = async (io) => {
  let job = schedule.scheduleJob("10 04 * * *", function () {
    //console.log("10 tar job");
    aljazeera(io);
    businessinsider(io);
  });
};

exports.fivePmJob = async (io) => {
  let job = schedule.scheduleJob("10 05 * * *", function () {
    //console.log("10 tar job");
    cbc(io);
    cicnews(io);
  });
};

exports.sixPmJob = async (io) => {
  let job = schedule.scheduleJob("10 06 * * *", function () {
    //console.log("10 tar job");
    cnet(io);
    foxnews(io);
  });
};

exports.sevenPmJob = async (io) => {
  let job = schedule.scheduleJob("10 07 * * *", function () {
    //console.log("10 tar job");
    bbc(io);
    nypost(io);
    //foxnews(io);
  });
};

exports.eightPmJob = async (io) => {
  let job = schedule.scheduleJob("10 08 * * *", function () {
    //console.log("10 tar job");
    bloomberg(io);
    cnn(io);
    //foxnews(io);
  });
};

exports.sevenTeenPmJob = async (io) => {
  let job = schedule.scheduleJob("10 17 * * *", function () {
    //console.log("10 tar job");
    dev(io);
    medium(io);
  });
};

exports.eighteenPmJob = async (io) => {
  let job = schedule.scheduleJob("10 09 * * *", function () {
    //console.log("10 tar job");
    //dev(io);
    //bbc(io);
    washingtonpost(io);
    gurdian(io);
  });

  exports.tenAmJob = async (io) => {
    let job = schedule.scheduleJob("10 10 * * *", function () {
      ctv(io);
      globalnews(io);
    });
  };

  exports.nineTeenPmJob = async (io) => {
    let job = schedule.scheduleJob("10 19 * * *", function () {
      //console.log("10 tar job");
      ctv(io);
      globalnews(io);
      //bloomberg(io);
    });
  };

  exports.twentyPmJob = async (io) => {
    let job = schedule.scheduleJob("53 18 * * *", function () {
      //console.log("10 tar job");
      // dev(io);
      // medium(io);
      // nasa(io);
      // redditblog(io);
      // washingtonpost(io);
      // cnn(io);
      //ctv(io);
      // globalnews(io);
      //toronto(io);
    });
  };
};
