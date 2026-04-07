const express = require('express');
const { getStats, getAlerts } = require('../controllers/dashboardController');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/stats', auth(['Admin', 'Health Officer']), getStats);
router.get('/alerts', auth(['Admin', 'Health Officer']), getAlerts);

module.exports = router;
