const User = require("../../models/credential");

const fs = require("fs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

// get config vars
dotenv.config();

exports.createOnline = async (id) => {
  try {
    const findUser = await Online.findById({ user: id });
    if (findUser) {
      return true;
    }
    const info = new Online({
      user: id,
      status: 1,
    });
    const result = await info.save();

    if (result) {
      return true;
    }
  } catch (error) {
    return false;
  }
};

exports.removeSinglePhoto = async (id) => {
  try {
    let result = await User.findOne({ _id: id }).select("photo");

    let filetoremove = `./client/public/team/upload/${result.photo}`;
    fs.unlinkSync(filetoremove, (err) => {
      if (err) throw err;
    });
  } catch (error) {
    //console.log(error);
    return false;
  }
};

exports.removeSingleFile = async (id, model, folder) => {
  try {
    let result = await model.findOne({ _id: id }).select("file");

    let filetoremove = `./client/public/${folder}/upload/${result.file}`;
    fs.unlinkSync(filetoremove, (err) => {
      if (err) throw err;
    });
  } catch (error) {
    console.log(error);
    return false;
  }
};

exports.deletePhoto = async (id, model, folder) => {
  try {
    let result = await model.findOne({ _id: id }).select("photo");
    result.photo.map((res) => {
      let filetoremove = `./client/public/${folder}/upload/${res}`;
      fs.unlinkSync(filetoremove, (err) => {
        if (err) throw err;
        console.log("photo removed");
      });
    });
  } catch (error) {
    console.log(error);
  }
};

exports.getInfo = async (token, model) => {
  const { _id, checkSum, country, inistitute } = jwt.decode(token);
  try {
    if (checkSum === "std5987") {
      let result = await model
        .find({
          user: _id,
        })
        .populate({
          path: "user",
          select: "first_name last_name,picture",
        })
        .populate({
          path: "comments",
          populate: {
            path: "user",
            select: "first_name last_name picture",
          },
        })
        .sort({ createdAt: -1 });

      return result;
    } else if (checkSum === "md888") {
      let result = await model
        .find({
          inistitute,
        })
        .populate({
          path: "user",
          select: "first_name last_name,picture",
        })
        .sort({ createdAt: -1 });

      return result;
    } else if (checkSum === "cn999") {
      let result = await model
        .find({
          country,
        })
        .populate({
          path: "user",
          select: "first_name last_name,picture",
        })
        .sort({ createdAt: -1 });

      return result;
    } else if (checkSum === "gb111") {
      let result = await model
        .find({
          user: _id,
        })
        .populate({
          path: "user",
          select: "first_name last_name,picture",
        })
        .sort({ createdAt: -1 });

      return result;
    } else {
      let result = await model
        .find()
        .populate({
          path: "user",
          select: "first_name last_name,picture",
        })
        .sort({ createdAt: -1 });

      return result;
    }
  } catch (error) {
    console.log(error);
    return false;
  }
};

exports.addPoint = async (id, point, userid) => {
  try {
    const event = new Point({
      postId: id,
      point,
      user: userid,
    });
    const result = await event.save();

    if (result) {
      return res.status(202).json(true);
    }
  } catch (error) {
    return false;
  }
};

exports.removePoint = async (id) => {
  try {
    const result = await Point.findOneAndDelete({ postId: id });

    if (result) {
      return res.status(202).json(true);
    }
  } catch (error) {
    return res.status(422).json(false);
  }
};

exports.getInfoLength = async (token, model) => {
  const { _id, checkSum, country, inistitute } = jwt.decode(token);
  try {
    if (checkSum === "std5987") {
      let result = await model.find({
        user: _id,
      });

      return result.length;
    } else if (checkSum === "md888") {
      let result = await model.find({
        inistitute,
      });

      return result.length;
    } else if (checkSum === "cn999") {
      let result = await model.find({
        country,
      });

      return result.length;
    } else if (checkSum === "gb111") {
      let result = await model.find({
        user: _id,
      });

      return result.length;
    } else {
      let result = await model
        .find()
        .populate({
          path: "user",
          select: "first_name last_name,picture",
        })
        .sort({ createdAt: -1 });

      return result.length;
    }
  } catch (error) {
    //console.log(error);
    return false;
  }
};
