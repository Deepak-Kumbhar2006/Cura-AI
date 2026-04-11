const express = require('express');
const { addRecord, getAllRecords, addDiagnosis, bulkEntry, getMyRecords, getRecordById } = require('../controllers/dataController');
const auth = require('../middleware/auth');
const { validateHealthRecord } = require('../middleware/validateInput');

const router = express.Router();

router.post('/add', auth(['patient']), validateHealthRecord, addRecord);
router.get('/all', auth(['doctor', 'patient']), getAllRecords);
router.get('/me', auth(['patient']), getMyRecords);
router.get('/:id', auth(['doctor', 'patient']), getRecordById);
router.patch('/:id/diagnosis', auth(['doctor']), addDiagnosis);
router.post('/bulk', auth(['doctor']), bulkEntry);

module.exports = router;
