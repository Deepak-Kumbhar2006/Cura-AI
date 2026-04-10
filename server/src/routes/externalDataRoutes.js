const express = require('express');
const auth = require('../middleware/auth');
const {
  getOverview,
  getOutbreakCatalog,
  predictOutbreak,
} = require('../controllers/externalDataController');

const router = express.Router();

router.get('/overview', auth(['doctor', 'patient']), getOverview);
router.get('/outbreak/catalog', auth(['doctor', 'patient']), getOutbreakCatalog);
router.post('/outbreak/predict', auth(['doctor', 'patient']), predictOutbreak);

module.exports = router;
