const express = require('express');
const { addRecord, getAllRecords } = require('../controllers/dataController');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/add', auth(['Admin', 'Health Officer']), addRecord);
router.get('/all', auth(['Admin', 'Health Officer']), getAllRecords);

module.exports = router;
