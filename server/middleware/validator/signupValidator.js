const { body } = require("express-validator");

const User = require("../../models/credential");

module.exports.signUpValidator = [
  body("name")
    .isLength({
      min: 5,
      max: 15,
    })
    .withMessage("Username must be 2 to 15 characters "),

  body("email")
    .isEmail()
    .withMessage("Email format is wrong")
    .custom(async (email) => {
      let user = await User.findOne({
        email,
      });
      if (user) {
        return Promise.reject("Email already exist");
      }
    })
    .normalizeEmail(),

  body("password")
    .isLength({
      min: 2,
    })
    .withMessage("Password must be more than 2 digits"),

  body("repassword")
    .isLength({
      min: 2,
    })
    .withMessage("Password must be more than 2 digits")
    .custom((repassword, { req }) => {
      if (repassword != req.body.password) {
        throw new Error("Password dosent not match");
      }
      return true;
    }),
];

module.exports.loginValidator = [
  body("email").isEmail().withMessage("Email format is wrong").normalizeEmail(),

  body("password")
    .isLength({
      min: 2,
    })
    .withMessage("Password must be more than 2 digits"),
];

module.exports.forgetPasswordValidator = [
  body("email")
    .not()
    .isEmpty()
    .withMessage("Email address must be Provided.")
    .isEmail()
    .withMessage("Email format is wrong")
    .normalizeEmail(),
];

module.exports.forgetPasswordValidationActive = [
  body("password")
    .not()
    .isEmpty()
    .withMessage("Password Required.")
    .isLength({
      min: 2,
    })
    .withMessage("Password must be more than 2 digits"),

  body("repassword")
    .isLength({
      min: 2,
    })
    .withMessage("Password must be more than 2 digits")
    .custom((repassword, { req }) => {
      if (repassword != req.body.password) {
        throw new Error("Password dosent not match");
      }
      return true;
    }),
];
