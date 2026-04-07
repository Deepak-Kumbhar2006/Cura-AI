const express = require("express");
const router = express.Router();
const {
    saveHealthData,
    getHealthHistory,
    getHealthInsights,
    downloadReport,
} = require("../controllers/health.controller");

const authMiddleware = require("../middleware/auth.middleware");

// Save history (legacy / manual)
router.post("/save", authMiddleware, saveHealthData);

// Get full conversation-based health history (grouped by session)
router.get("/history", authMiddleware, getHealthHistory);

// AI-generated health insights from chat history
router.get("/insights", authMiddleware, getHealthInsights);

// Download PDF report with AI summary
router.get("/report", authMiddleware, downloadReport);

module.exports = router;