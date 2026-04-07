const express = require("express");
const router = express.Router();
const { chatWithAI } = require("../controllers/chat.controller");
const optionalAuthMiddleware = require("../middleware/optionalAuth.middleware");

router.post("/", optionalAuthMiddleware, chatWithAI);

module.exports = router;
