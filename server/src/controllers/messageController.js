const ConversationMessage = require('../models/ConversationMessage');
const User = require('../models/User');

const ensureRolePair = (me, other) => {
  if (!other) return false;
  return me.role !== other.role;
};

exports.getContacts = async (req, res) => {
  try {
    const targetRole = req.user.role === 'doctor' ? 'patient' : 'doctor';
    const contacts = await User.find({ role: targetRole }).select('_id name email role').limit(200).lean();

    const lastMessages = await ConversationMessage.aggregate([
      { $match: { participants: { $in: [req.user.id] } } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$senderId', req.user.id] },
              '$receiverId',
              '$senderId',
            ],
          },
          lastMessage: { $first: '$message' },
          lastAt: { $first: '$createdAt' },
        },
      },
    ]);

    const byId = new Map(lastMessages.map((m) => [String(m._id), m]));
    return res.status(200).json(
      contacts.map((c) => ({
        ...c,
        lastMessage: byId.get(String(c._id))?.lastMessage || '',
        lastAt: byId.get(String(c._id))?.lastAt || null,
      }))
    );
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch contacts', error: error.message });
  }
};

exports.getConversation = async (req, res) => {
  try {
    const other = await User.findById(req.params.userId).select('_id role');
    if (!ensureRolePair(req.user, other)) {
      return res.status(403).json({ message: 'Doctor and patient direct chat only' });
    }

    const messages = await ConversationMessage.find({
      participants: { $all: [req.user.id, req.params.userId] },
    })
      .sort({ createdAt: 1 })
      .limit(500)
      .lean();

    return res.status(200).json(messages);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch messages', error: error.message });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !String(message).trim()) return res.status(400).json({ message: 'Message is required' });

    const other = await User.findById(req.params.userId).select('_id role');
    if (!ensureRolePair(req.user, other)) {
      return res.status(403).json({ message: 'Doctor and patient direct chat only' });
    }

    const created = await ConversationMessage.create({
      participants: [req.user.id, req.params.userId].sort(),
      senderId: req.user.id,
      receiverId: req.params.userId,
      message: String(message).trim(),
    });

    return res.status(201).json(created);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to send message', error: error.message });
  }
};
