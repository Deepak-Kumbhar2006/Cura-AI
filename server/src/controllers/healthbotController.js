const axios = require('axios');
const DEFAULT_HEALTHBOT_URL = 'https://healthbot-k1ha.onrender.com';

exports.chatWithLegacyBot = async (req, res) => {
  const message = req.body?.message;
  if (!message) return res.status(400).json({ reply: 'Please provide a message.' });

  const base = process.env.LEGACY_HEALTHBOT_URL || DEFAULT_HEALTHBOT_URL;

  try {
    const { data } = await axios.post(base, { message }, { timeout: 8000 });
    return res.status(200).json({ reply: data.reply || data.response || 'Legacy bot replied successfully.' });
  } catch (_error) {
    return res.status(200).json({ reply: 'Legacy HealthBot is currently offline. Please try again.' });
  }
};
