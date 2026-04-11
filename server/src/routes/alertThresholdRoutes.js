const express = require('express');
const auth = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');
const { createThreshold, getThresholds, updateThreshold, deleteThreshold } = require('../controllers/alertThresholdController');

const router = express.Router();

// Feature 14: Alert threshold configuration
router.post('/', auth(['doctor']), requirePermission('manage_thresholds'), createThreshold);
router.get('/', auth(['doctor', 'patient']), getThresholds);
router.patch('/:id', auth(['doctor']), requirePermission('manage_thresholds'), updateThreshold);
router.delete('/:id', auth(['doctor']), requirePermission('manage_thresholds'), deleteThreshold);

module.exports = router;
