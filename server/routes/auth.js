const express = require("express");

const router = express.Router();
const {
  signupPost,
  accountActivation,
  loginPost,
  userRegistration,
  addData,
  addUrl,
  allUrl,
  deleteUrl,
  updateUrl,
  dataHistory,
  searchRecord,
  allRecord,
  recordHistory,
  calculateHistory,
  cancelRequest,
  countAPI,
  testCountAPI,
} = require("../controller/authController");

const {
  signUpValidator,
  loginValidator,
} = require("../middleware/validator/signupValidator");

const { checkUniqueUrl } = require("../middleware/authUser");

//router.post("/signup", signUpValidator, signupPost);

router.post("/login", loginPost);
router.post("/user-reg", userRegistration);

// add data related route
router.post("/add-data", checkUniqueUrl, addData);

router.post("/add-url", addUrl);
router.get("/all-url", allUrl);
router.put("/update-url", updateUrl);
router.delete("/delete-url", deleteUrl);
router.post("/data-history", dataHistory);

router.post("/search-record", searchRecord);
router.post("/history", recordHistory);
router.get("/all-record", allRecord);
router.post("/stop", cancelRequest);
// dashboard related api
router.get("/dashboard", calculateHistory);
router.get("/count-api", countAPI);
router.get("/test-count-api", testCountAPI);

module.exports = router;
