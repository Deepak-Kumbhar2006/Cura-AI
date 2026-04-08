const { fetchGdeltCounts, fetchOpenMeteo, fetchCdcSignal, buildTrends } = require('../services/trendService');

exports.getLocalTrends = async (req, res) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    const location = req.query.location || 'Current Location';

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return res.status(400).json({ message: 'lat and lng query params are required' });
    }

    const [gdelt, weather, cdcSignal] = await Promise.all([
      fetchGdeltCounts(),
      fetchOpenMeteo(lat, lng),
      fetchCdcSignal(),
    ]);

    const trends = buildTrends({ counts: gdelt.counts, weather, cdcSignal, location });

    return res.status(200).json({
      location,
      coordinates: { lat, lng },
      weather,
      cdcSignal,
      gdeltCounts: gdelt.counts,
      trends,
      articles: gdelt.articles,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load local trends', error: error.message });
  }
};
