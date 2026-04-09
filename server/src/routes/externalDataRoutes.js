const express = require('express');
const auth = require('../middleware/auth');
const { getOverview } = require('../controllers/externalDataController');

const router = express.Router();

router.get('/overview', auth(['doctor', 'patient']), getOverview);

module.exports = router;
