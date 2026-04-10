const express = require("express");
const router = express.Router();
const { predict, predictFromImage } = require("../controllers/predict.controller");
const authMiddleware = require("../middleware/auth.middleware");

router.post("/", authMiddleware, predict);
router.post("/image", authMiddleware, predictFromImage);

module.exports = router;
