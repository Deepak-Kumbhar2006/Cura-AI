const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth.middleware");

// Get all alerts
router.get("/", async (req, res) => {
  try {
    // Dummy data - replace with real DB queries in production
    const alerts = [
      {
        id: 1,
        priority: "CRITICAL",
        region: "Metro North",
        message: "Rapid increase in influenza cases detected. Cases increased by 47% in the last 7 days.",
        date: new Date().toISOString()
      },
      {
        id: 2,
        priority: "HIGH",
        region: "South Zone",
        message: "Dengue outbreak warning. 3 new cases reported in clusters.",
        date: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 3,
        priority: "MEDIUM",
        region: "Central District",
        message: "COVID-19 variants detected. Monitor closely.",
        date: new Date(Date.now() - 7200000).toISOString()
      }
    ];
    res.json(alerts);
  } catch (err) {
    console.error("Error fetching alerts:", err);
    res.status(500).json({ message: "Failed to fetch alerts" });
  }
});

// Mark alert as read
router.patch("/:id/read", authMiddleware, async (req, res) => {
  try {
    res.json({ message: "Alert marked as read" });
  } catch (err) {
    console.error("Error marking alert:", err);
    res.status(500).json({ message: "Failed to update alert" });
  }
});

module.exports = router;
