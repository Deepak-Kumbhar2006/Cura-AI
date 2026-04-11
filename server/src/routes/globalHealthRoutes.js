const express = require('express');
const auth = require('../middleware/auth');
const ctrl = require('../controllers/globalHealthController');

const router = express.Router();

router.get('/', auth(['doctor', 'patient']), ctrl.getAllData);
router.get('/covid/global', auth(['doctor', 'patient']), ctrl.getCovidGlobal);
router.get('/covid/india', auth(['doctor', 'patient']), ctrl.getCovidIndia);
router.get('/covid/timeline', auth(['doctor', 'patient']), ctrl.getCovidTimeline);
router.get('/covid/countries', auth(['doctor', 'patient']), ctrl.getTopCountries);
router.get('/who/indicators', auth(['doctor', 'patient']), ctrl.getWhoIndicators);
router.get('/who/diseases', auth(['doctor', 'patient']), ctrl.getWhoDiseases);
router.get('/worldbank', auth(['doctor', 'patient']), ctrl.getWorldBankHealth);
router.get('/cdc/resources', auth(['doctor', 'patient']), ctrl.getCdcResources);
router.get('/cdc/diseases', auth(['doctor', 'patient']), ctrl.getCdcDiseaseData);
router.get('/environment', auth(['doctor', 'patient']), ctrl.getEnvironmentalHealth);
router.get('/clinical', auth(['doctor', 'patient']), ctrl.getClinicalConditions);

module.exports = router;
