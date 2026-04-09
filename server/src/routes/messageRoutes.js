const express = require('express');
const auth = require('../middleware/auth');
const { getContacts, getConversation, sendMessage } = require('../controllers/messageController');

const router = express.Router();

router.get('/contacts', auth(['doctor', 'patient']), getContacts);
router.get('/:userId', auth(['doctor', 'patient']), getConversation);
router.post('/:userId', auth(['doctor', 'patient']), sendMessage);

module.exports = router;
