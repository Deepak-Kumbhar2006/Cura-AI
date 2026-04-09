const express = require('express');
const auth = require('../middleware/auth');
const { getLocalTrends } = require('../controllers/trendController');

const router = express.Router();
router.get('/local', auth(['doctor', 'patient']), getLocalTrends);

module.exports = router;
