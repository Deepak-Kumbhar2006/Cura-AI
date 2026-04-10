const express = require('express');
const auth = require('../middleware/auth');
const { validatePagination } = require('../middleware/validateInput');
const { requirePermission } = require('../middleware/rbac');
const { getLogs } = require('../controllers/auditController');

const router = express.Router();

// Feature 5: Audit logging — view logs (doctors only)
router.get('/', auth(['doctor']), requirePermission('view_audit'), validatePagination, getLogs);

module.exports = router;
