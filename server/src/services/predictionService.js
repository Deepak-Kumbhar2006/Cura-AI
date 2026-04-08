const axios = require('axios');

async function getPrediction(payload) {
  const url = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000/predict';
  const { data } = await axios.post(url, payload, { timeout: 6000 });
  return data;
}

module.exports = { getPrediction };
