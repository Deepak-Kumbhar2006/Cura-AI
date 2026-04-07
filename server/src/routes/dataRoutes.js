const express = require('express');
const { addRecord, getAllRecords } = require('../controllers/dataController');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/add', auth(['patient']), addRecord);
router.get('/all', auth(['doctor', 'patient']), getAllRecords);

module.exports = router;
