const express = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const optionalAuth = require("../middleware/optionalAuth.middleware");
const {
  simulateProgression,
  riskScore,
  prescriptionSafety,
  emotionCheck,
  labAnalyzer,
  dailyCoach,
  timeline,
  advancedInsights,
  ultraInsights,
  skinDiseaseDetect,
  labReportExplain,
} = require("../controllers/intelligence.controller");

const router = express.Router();

router.post("/progression", authMiddleware, simulateProgression);
router.post("/risk-score", authMiddleware, riskScore);
router.post("/prescription-safety", authMiddleware, prescriptionSafety);
router.post("/emotion-check", authMiddleware, emotionCheck);
router.post("/lab-analyzer", authMiddleware, labAnalyzer);
router.post("/daily-coach", authMiddleware, dailyCoach);
router.post("/advanced-insights", authMiddleware, advancedInsights);
router.post("/ultra-insights", authMiddleware, ultraInsights);
router.post("/skin-detect", authMiddleware, skinDiseaseDetect);
router.post("/lab-report-explain", authMiddleware, labReportExplain);
router.get("/timeline", optionalAuth, timeline);

module.exports = router;
