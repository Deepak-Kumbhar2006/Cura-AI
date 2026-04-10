const express = require('express');
const auth = require('../middleware/auth');
const { getFreshness, getApiStatuses, getMetadata } = require('../controllers/apiStatusController');

const router = express.Router();

// Feature 3: Data latency & freshness
router.get('/freshness', auth(['doctor', 'patient']), getFreshness);

// Feature 4: API reliability
router.get('/status', auth(['doctor', 'patient']), getApiStatuses);

// Feature 16: Metadata display
router.get('/metadata', auth(['doctor', 'patient']), getMetadata);

module.exports = router;
