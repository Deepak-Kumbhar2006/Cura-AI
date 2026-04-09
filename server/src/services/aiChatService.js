const axios = require('axios');

function extractText(response) {
  return (
    response?.data?.choices?.[0]?.message?.content ||
    response?.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
    response?.data?.[0]?.generated_text ||
    null
  );
}

async function chatWithOpenRouter(messages) {
  if (!process.env.OPENROUTER_API_KEY) return null;
  const response = await axios.post(
    'https://openrouter.ai/api/v1/chat/completions',
    {
      model: process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini',
      messages,
      temperature: 0.2,
      max_tokens: 280,
    },
    {
      headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}` },
      timeout: 12000,
    }
  );
  return extractText(response);
}

async function chatWithGroq(messages) {
  if (!process.env.GROQ_API_KEY) return null;
  const response = await axios.post(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
      messages,
      temperature: 0.2,
      max_tokens: 280,
    },
    {
      headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      timeout: 12000,
    }
  );
  return extractText(response);
}

async function chatWithGemini(userPrompt) {
  if (!process.env.GEMINI_API_KEY) return null;
  const response = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      contents: [{ parts: [{ text: userPrompt }] }],
    },
    { timeout: 12000 }
  );
  return extractText(response);
}

async function chatWithHF(userPrompt) {
  if (!process.env.HF_API_KEY) return null;
  const response = await axios.post(
    'https://api-inference.huggingface.co/models/google/flan-t5-large',
    { inputs: userPrompt },
    {
      headers: { Authorization: `Bearer ${process.env.HF_API_KEY}` },
      timeout: 12000,
    }
  );
  return extractText(response);
}

async function generateAiChatReply({ message, role, context }) {
  const system = `You are Cura AI health assistant for ${role}. Give concise, safe health guidance. Mention uncertainty and suggest doctor consult for severe symptoms.`;
  const messages = [
    { role: 'system', content: system },
    { role: 'user', content: `Context: ${context || 'none'}\nQuestion: ${message}` },
  ];

  const plainPrompt = `${system}\nContext: ${context || 'none'}\nQuestion: ${message}`;

  const providers = [
    () => chatWithOpenRouter(messages),
    () => chatWithGroq(messages),
    () => chatWithGemini(plainPrompt),
    () => chatWithHF(plainPrompt),
  ];

  for (const provider of providers) {
    try {
      const text = await provider();
      if (text) return text;
    } catch (_e) {
      // try next provider
    }
  }

  return null;
}

module.exports = { generateAiChatReply };
