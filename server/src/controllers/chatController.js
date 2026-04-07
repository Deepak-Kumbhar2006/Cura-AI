const HealthRecord = require('../models/HealthRecord');
const axios = require('axios');

function generateReply(message, role) {
  const text = (message || '').toLowerCase();
  if (text.includes('symptom')) return 'Based on your symptoms, you may have a mild infection. Please monitor vitals and rest.';
  if (text.includes('outbreak') || text.includes('nearby')) return 'Nearby outbreaks are being monitored. Avoid crowded spaces and follow hygiene protocols.';
  if (text.includes('tip') || text.includes('health')) return 'Stay hydrated, sleep well, and seek medical care if fever or breathing issues persist.';
  if (role === 'doctor') return 'Doctor insight: prioritize high-risk regions and review confirmed/suspected case counts daily.';
  return 'Please consult a doctor if symptoms persist or worsen over the next 24–48 hours.';
}

async function askOpenAI(message, latestRisk) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const systemPrompt = 'You are a healthcare triage assistant. Give concise, safe, non-diagnostic guidance and advise doctor consultation when needed.';
  const userPrompt = `User message: "${message}"\nLatest known risk: ${latestRisk || 'Unknown'}`;

  const { data } = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.4,
      max_tokens: 180,
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 8000,
    }
  );

  return data?.choices?.[0]?.message?.content?.trim() || null;
}

exports.chat = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !String(message).trim()) return res.status(400).json({ reply: 'Please enter a message.' });

    const latest = await HealthRecord.findOne(req.user.role === 'patient' ? { userId: req.user.id } : {}).sort({ createdAt: -1 });
    const openAIReply = await askOpenAI(message, latest?.risk).catch(() => null);
    const context = latest ? ` Latest risk on record: ${latest.risk}.` : '';
    const reply = openAIReply || (generateReply(message, req.user.role) + context);
    return res.status(200).json({ reply });
  } catch (_error) {
    return res.status(500).json({ reply: 'Chatbot is temporarily unavailable. Please try again.' });
  }
};
