const express = require('express');
const auth = require('../middleware/auth');
const { chatWithLegacyBot } = require('../controllers/healthbotController');

const router = express.Router();
router.post('/chat', auth(['doctor', 'patient']), chatWithLegacyBot);

module.exports = router;
