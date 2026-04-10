const express = require('express');
const auth = require('../middleware/auth');
const { validatePagination } = require('../middleware/validateInput');
const { getQualityLogs, getQualityStats } = require('../controllers/dataQualityController');

const router = express.Router();

// Feature 1: Data quality logs and stats
router.get('/logs', auth(['doctor']), validatePagination, getQualityLogs);
router.get('/stats', auth(['doctor']), getQualityStats);

module.exports = router;
