const express = require('express');
const auth = require('../middleware/auth');
const { validatePagination } = require('../middleware/validateInput');
const { createSnapshot, getSnapshots, compareSnapshots } = require('../controllers/dataVersioningController');

const router = express.Router();

// Feature 2: Data versioning & history tracking
router.post('/', auth(['doctor']), createSnapshot);
router.get('/', auth(['doctor', 'patient']), validatePagination, getSnapshots);
router.get('/compare', auth(['doctor']), compareSnapshots);

module.exports = router;
