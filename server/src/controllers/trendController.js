const {
  fetchGdeltCounts,
  fetchOpenMeteo,
  fetchCdcSignal,
  fetchNewsApiSignal,
  buildTrends,
} = require('../services/trendService');

exports.getLocalTrends = async (req, res) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    const location = req.query.location || 'Current Location';

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return res.status(400).json({ message: 'lat and lng query params are required' });
    }

    const [gdeltResult, weatherResult, cdcResult, newsResult] = await Promise.allSettled([
      fetchGdeltCounts(),
      fetchOpenMeteo(lat, lng),
      fetchCdcSignal(),
      fetchNewsApiSignal(),
    ]);

    const gdelt = gdeltResult.status === 'fulfilled'
      ? gdeltResult.value
      : { counts: { dengue: 0, flu: 0, covid: 0, malaria: 0 }, articles: [] };

    const weather = weatherResult.status === 'fulfilled'
      ? weatherResult.value
      : { temperature: 29, humidity: 60, precipitation: 0 };

    const cdcSignal = cdcResult.status === 'fulfilled' ? cdcResult.value : 0;
    const newsApiSignal = newsResult.status === 'fulfilled' ? newsResult.value : 0;

    const trends = buildTrends({ counts: gdelt.counts, weather, cdcSignal, newsApiSignal, location });

    return res.status(200).json({
      location,
      coordinates: { lat, lng },
      weather,
      cdcSignal,
      newsApiSignal,
      gdeltCounts: gdelt.counts,
      trends,
      articles: gdelt.articles,
      dataQuality: {
        gdeltArticles: gdelt.articles.length,
        newsApiEnabled: Boolean(process.env.NEWSAPI_KEY),
        partialFallback: [gdeltResult, weatherResult, cdcResult, newsResult].some((x) => x.status === 'rejected'),
      },
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load local trends', error: error.message });
  }
};
