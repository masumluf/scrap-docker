const User = require("../models/credential");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");

const { sendEmail } = require("../utils/Email");

const _ = require("lodash");
const bcrypt = require("bcrypt");

const errorFormat = require("../utils/validationErrorFormatter");

exports.readUserProfile = async (req, res) => {
  const userId = req.params.id;
  try {
    console.log(userId);
    let user = await User.findById(userId);
    user.password = undefined;
    res.json(user);
  } catch (e) {
    res.status(422).json({
      error: e,
    });
  }
};

exports.updateUserProfile = async (req, res) => {
  console.log(req.user);
  console.log(req.body);
};

exports.forgetPassword = async (req, res) => {
  let errorResult = validationResult(req).formatWith(errorFormat);

  if (!errorResult.isEmpty()) {
    return res.status(422).json({
      error: errorResult.mapped(),
    });
  }
  let { email } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) {
      let token = jwt.sign({ _id: user._id }, process.env.JWT_RESET_PASSWORD, {
        expiresIn: "1d",
      });
      let url = `${process.env.CLIENT_URI}/api/user/forget/password/active/${token}`;
      let msg = `Please Click on this link to reset your password ${url}`;
      sendEmail(email, "Password Reset Link", msg);
      let updateResult = await user.updateOne({ passwordResetLink: url });
      if (!updateResult) {
        return res.status(422).json({
          error: "Database Error.",
        });
      }
      return res.status(200).json({
        message: "Password Reset Link sent.Check your Email.",
      });
    } else {
      return res.status(422).json({
        error: "User not found.",
      });
    }
  } catch (e) {
    console.log(e);
    return res.status(422).json({
      error: e,
    });
  }
};

exports.activeForgetPassword = async (req, res) => {
  let errorResult = validationResult(req).formatWith(errorFormat);

  if (!errorResult.isEmpty()) {
    return res.status(422).json({
      error: errorResult.mapped(),
    });
  }
  let { token, password } = req.body;

  try {
    let updateResult = await jwt.verify(token, process.env.JWT_RESET_PASSWORD);
    //console.log(updateResult._id)
    if (updateResult) {
      let user = await User.findOne({ _id: updateResult._id });

      let hashPassword = await bcrypt.hash(password, 8);

      let result = await User.findOneAndUpdate(
        { _id: user._id },
        {
          $set: {
            password: hashPassword,
            passwordResetLink: "",
          },
        }
      );

      if (result) {
        return res.status(200).json({
          message: "Password Updated.",
        });
      }

      // console.log(user._id,hashPassword)
    }
  } catch (e) {
    return res.status(401).json({
      error: e,
    });
  }
};
