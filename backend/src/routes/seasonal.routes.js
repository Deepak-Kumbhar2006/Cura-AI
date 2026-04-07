const express = require("express");
const { getSeasonalAlert } = require("../controllers/seasonal.controller");
const router = express.Router();


router.get("/", getSeasonalAlert);

module.exports = router;
