const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const Info = require("../models/article");
// get config vars
dotenv.config();

exports.checkAdmin = async (req, res, next) => {
  let { token } = req.body;

  try {
    if (!token) {
      return res
        .status(422)
        .json({ error: "You are not Authorized for this action" });
    } else {
      let jwtVerify = await jwt.verify(token, process.env.JWT_SECRET);

      if (!jwtVerify) {
        return res.status(422).json({ error: "Wrong Token" });
      }
    }

    const { checkSum } = jwt.decode(token);

    if (!checkToken(checkSum)) {
      return res
        .status(422)
        .json({ error: "You are not Authorized for this action" });
    } else next();
  } catch (error) {
    return res.status(422).json({ error: "Invalid Token" });
  }
};

const checkToken = (checkSum) => {
  if (checkSum === "ad587") return true;
  else return false;
};

const findUrl = async (content_url) => {
  try {
    let check = await Info.findOne({ content_url });
    return !check;
  } catch (e) {
    return false;
  }
};

exports.checkUniqueUrl = async (req, res, next) => {
  let { content_url } = req.body;

  try {
    let check = await findUrl(content_url);
    console.log(check);
    if (check === null && check) return res.status(403).json(false);
    else next();
  } catch (e) {
    return res.status(503).json(false);
  }
};
