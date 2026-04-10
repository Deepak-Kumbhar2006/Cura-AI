const express = require('express');
const auth = require('../middleware/auth');
const { validatePagination } = require('../middleware/validateInput');
const { requirePermission } = require('../middleware/rbac');
const {
  getEpidemiologyMetrics,
  getAggregatedData,
  getRuleInsights,
  compareRegions,
  compareTimePeriods,
  advancedQuery,
  getPaginatedRecords,
} = require('../controllers/analyticsController');

const router = express.Router();

// Feature 7 & 8: Epidemiological metrics + normalization per 100K
router.get('/epidemiology', auth(['doctor', 'patient']), getEpidemiologyMetrics);

// Feature 12: Aggregation pipelines
router.get('/aggregated', auth(['doctor', 'patient']), getAggregatedData);

// Feature 17: Rule-based insights
router.get('/insights', auth(['doctor', 'patient']), getRuleInsights);

// Feature 15: Comparative analysis
router.get('/compare/regions', auth(['doctor']), compareRegions);
router.get('/compare/periods', auth(['doctor']), compareTimePeriods);

// Feature 6: Advanced filtering & query engine
router.get('/query', auth(['doctor', 'patient']), validatePagination, advancedQuery);

// Feature 11: Paginated records
router.get('/records', auth(['doctor', 'patient']), validatePagination, getPaginatedRecords);

module.exports = router;
