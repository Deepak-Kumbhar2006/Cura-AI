const express = require('express');
const { addRecord, getAllRecords, addDiagnosis, bulkEntry, getMyRecords, getRecordById, uploadMedicalReport } = require('../controllers/dataController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const { validateAddRecord, validateDiagnosis, validateBulkEntry } = require('../middleware/validate');

const router = express.Router();

router.post('/add', auth(['patient']), validateAddRecord, addRecord);
router.post('/upload-report', auth(['patient']), upload.single('report'), uploadMedicalReport);
router.get('/all', auth(['doctor', 'patient']), getAllRecords);
router.get('/me', auth(['patient']), getMyRecords);
router.get('/:id', auth(['doctor', 'patient']), getRecordById);
router.patch('/:id/diagnosis', auth(['doctor']), validateDiagnosis, addDiagnosis);
router.post('/bulk', auth(['doctor']), validateBulkEntry, bulkEntry);

module.exports = router;
