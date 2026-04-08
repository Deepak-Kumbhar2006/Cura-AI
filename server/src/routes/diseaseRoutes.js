const express = require('express');
const { fetchTrendingDiseases } = require('../services/diseaseService');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/trending', auth(['doctor', 'patient']), async (req, res) => {
  try {
    const data = await fetchTrendingDiseases();
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch disease data', error: error.message });
  }
});

module.exports = router;
