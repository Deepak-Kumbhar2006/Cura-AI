const express = require('express');
const auth = require('../middleware/auth');
const {
  getDashboard,
  getRegions,
  getAlerts,
  getTrends,
  getEnvironment,
  getPredictions,
  compareScenarios,
  getPipelineStatus,
  getPersonalRisk,
  getRegionDetails,
  getDataset,
  getIntelligence,
} = require('../controllers/surveillanceController');

const router = express.Router();

router.get('/dashboard', auth(['doctor', 'patient']), getDashboard);
router.get('/regions', auth(['doctor', 'patient']), getRegions);
router.get('/regions/:region', auth(['doctor', 'patient']), getRegionDetails);
router.get('/alerts', auth(['doctor', 'patient']), getAlerts);
router.get('/trends', auth(['doctor', 'patient']), getTrends);
router.get('/environment', auth(['doctor', 'patient']), getEnvironment);
router.get('/predictions', auth(['doctor', 'patient']), getPredictions);
router.get('/predictions/compare', auth(['doctor', 'patient']), compareScenarios);
router.get('/personal-risk', auth(['doctor', 'patient']), getPersonalRisk);
router.get('/pipeline-status', auth(['doctor', 'patient']), getPipelineStatus);
router.get('/dataset', auth(['doctor', 'patient']), getDataset);
router.get('/intelligence', auth(['doctor', 'patient']), getIntelligence);

module.exports = router;
