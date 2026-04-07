const express = require('express');
const auth = require('../middleware/auth');
const { getPrediction } = require('../services/predictionService');

const router = express.Router();

router.post('/', auth(['doctor', 'patient']), async (req, res) => {
  try {
    const result = await getPrediction(req.body);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ message: 'Prediction failed', error: error.message });
  }
});

module.exports = router;
