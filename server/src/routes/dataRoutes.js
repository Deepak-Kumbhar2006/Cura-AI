const express = require('express');
const { addRecord, getAllRecords, addDiagnosis, bulkEntry } = require('../controllers/dataController');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/add', auth(['patient']), addRecord);
router.get('/all', auth(['doctor', 'patient']), getAllRecords);
router.patch('/:id/diagnosis', auth(['doctor']), addDiagnosis);
router.post('/bulk', auth(['doctor']), bulkEntry);

module.exports = router;
