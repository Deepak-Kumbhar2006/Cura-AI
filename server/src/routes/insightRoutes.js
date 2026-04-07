const express = require('express');
const { getInsights } = require('../controllers/dashboardController');
const auth = require('../middleware/auth');

const router = express.Router();
router.get('/', auth(['doctor', 'patient']), getInsights);

module.exports = router;
