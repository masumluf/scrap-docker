const User = require("../models/credential");
const Article = require("../models/article");
const News = require("../models/news");
const Web = require("../models/web");
const multer = require("multer");
const bcrypt = require("bcrypt");
const Queue = require("better-queue");
const axios = require("axios");
const { readTime } = require("./helper/readTime");

//authentication done

let articleCountAPI,
  infoCountAPI = null;

let socket;
const { removeSinglePhoto } = require("./helper/helper");
const {
  lastDate,
  firstDayOfTheMonth,
  firstDate,
} = require("../utils/dateFormat");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

let areaArray = ["canada", "bangladesh"];

exports.initSocket = (io) => {
  socket = io;
};

// get config vars
dotenv.config();
//sendGrid.setApiKey(process.env.SENDGRID_API_KEY);
const { validationResult } = require("express-validator");

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./client/public/team/upload");
  },
  filename: function (req, file, cb) {
    let finalName = Date.now() + "-" + file.originalname;

    //         (async () => {
    //  await resizer(`./thumbnails/${"test.jpg"}`, setup);
    //})();

    cb(null, finalName);
  },
});

var upload = multer({ storage: storage }).single("file");

const errorFormat = require("../utils/validationErrorFormatter");

// exports.signupView = (req, res, ) => {
//
//     res.render('auth/signup', {
//         title: 'Register as a New User',
//         error: {},
//         value: {},
//         flashMessage: Flash.getMessage(req)
//     })
// }

const geoLocationTracking = async (ip) => {
  try {
    let result = await axios({
      method: "GET",
      url: `http://ip-api.com/json/${ip}`,
    });
    if (result) {
      //console.log(result?.data?.country);
      return areaArray.some(
        (arr) => arr === result?.data?.country.toLowerCase(),
      );
    }
  } catch (e) {
    console.log(e);
  }
};

exports.loginPost = async (req, res) => {
  let { username, password, ip } = req.body;

  console.log(req.body);

  try {
    if (!(await geoLocationTracking(ip))) {
      return res.status(404).json({
        message: "Geo Location Security Error",
      });
    }

    let user = await User.findOne({
      username,
    });

    if (!user) {
      return res.status(422).json({
        message: "wrong Credentials",
      });
    }

    let isPassword = await bcrypt.compare(password, user.password);
    if (!isPassword) {
      return res.status(422).json({
        message: "wrong Password",
      });
    }
    //const clientIp = requestIp.getClientIp(req);

    let token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    //let { _id, name, email, role } = user;

    return res.status(200).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        role: user.role,
        checkSum: user.checkSum,
      },
      message: "Login Successfull",
    });
  } catch (e) {
    console.log(e);

    return res.status(402).json({
      message: "Sorry Failed to Login",
    });
  }
};

exports.userRegistration = async (req, res) => {
  upload(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(500).json(err);
    } else if (err) {
      return res.status(500).json(err);
    }

    try {
      let {
        username,
        password,
        name,
        phone,
        age,
        address,
        area,
        gender,
        join,
      } = req.body;

      //console.log(res.req.file);

      let photo = res.req.file.filename;
      const district = "laxmipur";

      let hashPassword = await bcrypt.hash(password, 8);

      const user = new User({
        username,
        password: hashPassword,
        name,
        phone,
        age,
        address,
        district,
        area,
        gender,
        join,
        district,
        checkSum: "sd123",
        photo,
      });
      const result = await user.save();

      if (result) {
        return res.status(200).json(true);
      }
    } catch (error) {
      //console.log(error);
      return res.status(422).json(false);
    }

    return res.status(200).send(req.file);
  });
};

exports.closeTime = async (req, res) => {
  console.log(req.body);
};

const findUrl = async (content_url) => {
  try {
    let check =
      (await type) === "article"
        ? Article.findOne({ content_url })
        : News.findOne({ content_url });
    //console.log("findUrl Function ", check);
    return !check;
  } catch (e) {
    return false;
  }
};

const checkUniqueUrl = async (content_url, type) => {
  try {
    if (content_url) {
      let check = await findUrl(content_url, type);
      //console.log("checkUnique Function", check );
      return !!(check === null || check);
    } else {
      return false;
    }
  } catch (e) {
    return false;
  }
};

exports.addData = async (obj) => {
  socket.emit("work-process", { data: "Data Saving..." });
  let check = await checkUniqueUrl(obj?.content_url, obj?.content_type);
  //console.log(obj?.topic);
  try {
    //console.log("add Data Func 2nd", check);
    //console.log(obj);
    // console.log(obj.title);
    let data = {
      ...obj,
      tag: obj.tag,
      fetch_from_internet: true,
      meta_title: obj.title,
      meta_description: obj.body,
      meta_tag: obj.tag,
      is_approved: true,
      status: "public",
      reading_time: readTime(obj.reading_time),
      slug: obj.title.toLowerCase().split(" ").join("-"),
    };

    if (obj.content_type === "news") {
      let saveData = await new News(data);
      let result = await saveData.save();
      console.log("Data Saved Successfully", obj.domain);
      return !!result;
    } else {
      let saveData = await new Article(data);
      let result = await saveData.save();
      console.log("Data Saved Successfully", obj.domain);
      return !!result;
    }
  } catch (e) {
    console.log(e);
    console.log("Duplicate data", obj.domain);
    return false;
  }
};

exports.addUrl = async (req, res) => {
  let { url, type } = req.body;

  if (!url) {
    return res.status(422).json({ url: "Please Enter Url" });
  } else if (!type) {
    return res.status(422).json({ type: "Please Enter Data Type" });
  }

  try {
    let web = await new Web(req.body);
    let result = await web.save();
    if (result) {
      return res.status(201).json(true);
    }
  } catch (e) {
    console.log(e);
    return res.status(500).json(false);
  }
};

exports.allUrl = async (_, res) => {
  try {
    let results = await Web.find().sort({ createdAt: -1 });
    return res.status(201).json(results);
  } catch (e) {
    return res.status(500).json(false);
  }
};

exports.deleteUrl = async (req, res) => {
  let { _id } = req.body;
  try {
    let results = await Web.findByIdAndRemove(_id);
    if (results) {
      return res.status(201).json(true);
    } else {
      return res.status(422).json(false);
    }
  } catch (e) {
    console.log(e);
    return res.status(500).json(false);
  }
};

exports.updateUrl = async (req, res) => {
  let { _id, url, type } = req.body;
  if (!url) {
    return res.status(422).json({ url: "Please Enter Url" });
  } else if (!type) {
    return res.status(422).json({ type: "Please Enter Data Type" });
  }

  try {
    let results = await Web.findOneAndUpdate(
      {
        _id,
      },
      {
        $set: {
          url,
          type,
        },
      },
    );

    if (results) {
      return res.status(201).json(true);
    } else {
      return res.status(422).json(false);
    }
  } catch (e) {
    return res.status(500).json(false);
  }
};

exports.dataHistory = async (req, res) => {
  let { date1, date2 } = req.body;

  let sDate = new Date(`${date1}T16:00:00.000Z`);
  let eDate = new Date(`${date2}T16:59:59.000Z`);

  try {
    const result = await Web.find({
      created_at: {
        $gte: sDate,
        $lte: eDate,
      },
    });
    return res.status(200).json(result);
  } catch (e) {
    console.log(e);
    return res.status(500).json(false);
  }
};

exports.allRecord = async (_, res) => {
  try {
    let results = await Article.find().limit(100).sort({ created_at: -1 });
    return res.status(201).json(results);
  } catch (e) {
    return res.status(500).json(false);
  }
};

exports.recordHistory = async (req, res) => {
  let { date1, date2 } = req.body;

  let sDate = new Date(`${date1}T16:00:00.000Z`);
  let eDate = new Date(`${date2}T16:59:59.000Z`);

  try {
    const result = await Article.find({
      created_at: {
        $gte: sDate,
        $lte: eDate,
      },
    });
    return res.status(200).json(result);
  } catch (e) {
    console.log(e);
    return res.status(500).json(false);
  }
};

exports.searchRecord = async (req, res) => {
  let { date1, date2 } = req.body;

  let sDate = new Date(`${date1}T16:00:00.000Z`);
  let eDate = new Date(`${date2}T16:59:59.000Z`);

  try {
    const result = await Article.find({
      created_at: {
        $gte: sDate,
        $lte: eDate,
      },
    }).countDocuments();
    return res.status(200).json(result);
  } catch (e) {
    console.log(e);
    return res.status(500).json(false);
  }
};

const calculateMonthlyHistory = async () => {
  try {
    let articleCount = await Article.find({
      createdAt: {
        $gte: firstDayOfTheMonth,
        $lte: lastDate,
      },
    }).countDocuments();

    let infoCount = await News.find({
      createdAt: {
        $gte: firstDayOfTheMonth,
        $lte: lastDate,
      },
    }).countDocuments();

    return articleCount + infoCount;
  } catch (e) {
    return false;
  }
};

exports.calculateDailyHistoryAPI = async () => {
  try {
    articleCountAPI = await Article.find({
      createdAt: {
        $gte: firstDayOfTheMonth,
        $lte: lastDate,
      },
    }).countDocuments();

    infoCountAPI = await News.find({
      createdAt: {
        $gte: firstDayOfTheMonth,
        $lte: lastDate,
      },
    }).countDocuments();

    //return articleCountAPI + infoCountAPI;
  } catch (e) {
    return false;
  }
};

exports.countAPI = async (_, res) => {
  try {
    if (articleCountAPI && infoCountAPI) {
      return res.status(201).json({ articleCountAPI, infoCountAPI });
    }
  } catch (e) {
    return res.status(500).json(false);
  }
};

exports.testCountAPI = async (_, res) => {
  try {
    let articleCount = await Article.find({
      createdAt: {
        $gte: firstDayOfTheMonth,
        $lte: lastDate,
      },
    }).countDocuments();

    let infoCount = await News.find({
      createdAt: {
        $gte: firstDayOfTheMonth,
        $lte: lastDate,
      },
    }).countDocuments();

    return res.status(201).json({ articleCount, infoCount });

    //return articleCountAPI + infoCountAPI;
  } catch (e) {
    return res.status(500).json(false);
  }
};

const calculateDailyHistory = async () => {
  try {
    let articleCount = await Article.find({
      created_at: {
        $gte: firstDate,
        $lte: lastDate,
      },
    }).countDocuments();
    let newsCount = await News.find({
      createdAt: {
        $gte: firstDate,
        $lte: lastDate,
      },
    }).countDocuments();
    return articleCount + newsCount;
  } catch (e) {
    return false;
  }
};
const calculateSiteHistory = async () => {
  try {
    return await Web.find().countDocuments();
  } catch (e) {
    return false;
  }
};

const lastTenHistory = async () => {
  try {
    return await Article.find().sort({ created_at: -1 }).limit(10);
  } catch (e) {
    return false;
  }
};

const lastTenSites = async () => {
  try {
    return await Web.find().sort({ created_at: -1 }).limit(10);
  } catch (e) {
    return false;
  }
};

exports.calculateHistory = async (_, res) => {
  try {
    let monthHistory = await calculateMonthlyHistory();
    let dayHistory = await calculateDailyHistory();
    let siteHistory = await calculateSiteHistory();
    let lastTenInfo = await lastTenHistory();
    let lastTenWeb = await lastTenSites();

    return res
      .status(201)
      .json({ monthHistory, dayHistory, siteHistory, lastTenInfo, lastTenWeb });
  } catch (e) {
    return res.status(500).json(false);
  }
};

exports.cancelRequest = async (_, res) => {
  return res.status(200).json(true);
};
