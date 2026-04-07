const express = require('express');
const auth = require('../middleware/auth');
const { chat } = require('../controllers/chatController');
const { validateChatMessage } = require('../middleware/validate');

const router = express.Router();
router.post('/', auth(['doctor', 'patient']), validateChatMessage, chat);

module.exports = router;
