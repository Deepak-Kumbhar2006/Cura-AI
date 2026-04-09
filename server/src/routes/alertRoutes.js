const express = require('express');
const auth = require('../middleware/auth');
const { getAlerts } = require('../controllers/surveillanceController');

const router = express.Router();

router.get('/', auth(['doctor', 'patient']), getAlerts);

module.exports = router;
