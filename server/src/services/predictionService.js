const axios = require('axios');

async function getPrediction(payload) {
  const aiUrl = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000/predict';
  const response = await axios.post(aiUrl, payload, { timeout: 5000 });
  return response.data;
}

module.exports = { getPrediction };
