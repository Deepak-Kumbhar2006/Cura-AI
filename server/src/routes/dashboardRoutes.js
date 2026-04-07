const express = require('express');
const { getStats, getInsights } = require('../controllers/dashboardController');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/stats', auth(['doctor', 'patient']), getStats);
router.get('/insights', auth(['doctor', 'patient']), getInsights);

module.exports = router;
