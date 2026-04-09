const express = require('express');
const auth = require('../middleware/auth');
const {
  getDashboard,
  getRegions,
  getAlerts,
  getTrends,
  getEnvironment,
  getPredictions,
  getDataset,
  getIntelligence,
} = require('../controllers/surveillanceController');

const router = express.Router();

router.get('/dashboard', auth(['doctor', 'patient']), getDashboard);
router.get('/regions', auth(['doctor', 'patient']), getRegions);
router.get('/alerts', auth(['doctor', 'patient']), getAlerts);
router.get('/trends', auth(['doctor', 'patient']), getTrends);
router.get('/environment', auth(['doctor', 'patient']), getEnvironment);
router.get('/predictions', auth(['doctor', 'patient']), getPredictions);
router.get('/dataset', auth(['doctor', 'patient']), getDataset);
router.get('/intelligence', auth(['doctor', 'patient']), getIntelligence);

module.exports = router;
