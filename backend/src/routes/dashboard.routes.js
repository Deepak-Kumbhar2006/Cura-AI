const express = require("express");
const router = express.Router();

// Dummy data for dashboard (replace with real DB queries in production)
router.get("/stats", (req, res) => {
  res.json({
    totalActiveCases: 1131,
    criticalAlerts: 1,
    highRiskRegions: 2,
    monitoredRegions: 5,
    predictionAccuracy: 84.0,
    trend: [
      { date: '2026-01-01', influenza: 180, covid19: 90, dengue: 40, malaria: 10 },
      { date: '2026-02-01', influenza: 300, covid19: 140, dengue: 55, malaria: 20 },
      { date: '2026-03-01', influenza: 430, covid19: 210, dengue: 85, malaria: 35 },
      { date: '2026-04-07', influenza: 590, covid19: 260, dengue: 180, malaria: 50 },
    ],
    distribution: [
      { name: 'Influenza', value: 51, color: '#3b82f6' },
      { name: 'COVID-19', value: 24, color: '#8b5cf6' },
      { name: 'Dengue', value: 16, color: '#ec4899' },
      { name: 'Malaria', value: 6, color: '#f59e0b' },
      { name: 'Tuberculosis', value: 4, color: '#10b981' },
    ]
  });
});

module.exports = router;
