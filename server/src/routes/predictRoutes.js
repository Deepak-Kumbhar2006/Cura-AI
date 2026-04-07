const express = require('express');
const auth = require('../middleware/auth');
const { getPrediction } = require('../services/predictionService');

const router = express.Router();

router.post('/', auth(['Admin', 'Health Officer']), async (req, res) => {
  try {
    const data = await getPrediction(req.body);
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: 'Prediction failed', error: error.message });
  }
});

module.exports = router;
