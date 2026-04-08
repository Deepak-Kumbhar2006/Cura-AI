const express = require('express');
const { fetchWeather } = require('../services/weatherService');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/:city', auth(['doctor', 'patient']), async (req, res) => {
  try {
    const data = await fetchWeather(req.params.city);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch weather', error: error.message });
  }
});

module.exports = router;
