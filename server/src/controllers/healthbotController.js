const axios = require('axios');

exports.chatWithLegacyBot = async (req, res) => {
  const message = req.body?.message;
  if (!message) return res.status(400).json({ reply: 'Please provide a message.' });

  const base = process.env.LEGACY_HEALTHBOT_URL;
  if (!base) return res.status(200).json({ reply: `HealthBot Legacy says: ${message}. (Legacy backend URL not configured)` });

  try {
    const { data } = await axios.post(base, { message }, { timeout: 8000 });
    return res.status(200).json({ reply: data.reply || data.response || 'Legacy bot replied successfully.' });
  } catch (_error) {
    return res.status(200).json({ reply: 'Legacy HealthBot is currently offline. Please try again.' });
  }
};
