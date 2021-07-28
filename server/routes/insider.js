const express = require("express");
const router = express.Router();
const { businessinsider } = require("../controller/businessinsider/insider")

router.get("/businessinsider", businessinsider);

module.exports = router;