const express = require('express');
const { getAlerts } = require('../controllers/dashboardController');
const auth = require('../middleware/auth');

const router = express.Router();
router.get('/', auth(['Admin', 'Health Officer']), getAlerts);

module.exports = router;
