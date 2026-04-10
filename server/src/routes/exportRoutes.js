const express = require('express');
const auth = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');
const { exportData } = require('../controllers/exportController');

const router = express.Router();

// Feature 9: Data export (CSV, JSON)
router.get('/', auth(['doctor']), requirePermission('export'), exportData);

module.exports = router;
