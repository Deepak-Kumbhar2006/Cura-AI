const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const {
  getMyProfile,
  updateMyProfile,
  getMyChatHistory,
  linkWhatsApp,
} = require("../controllers/profile.controller");

router.get("/me", authMiddleware, getMyProfile);
router.put("/me", authMiddleware, updateMyProfile);
router.get("/history", authMiddleware, getMyChatHistory);
router.post("/link-whatsapp", authMiddleware, linkWhatsApp);

module.exports = router;

