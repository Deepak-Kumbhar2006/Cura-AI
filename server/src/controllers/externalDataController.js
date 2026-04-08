const {
  fetchGdeltDiseaseNews,
  fetchOpenMeteoWeather,
  fetchNewsApi,
  fetchCdcData,
  fetchOpenFdaDrugLabels,
  geocodeCity,
} = require('../services/externalDataService');

const safe = async (fn, fallback) => {
  try {
    return await fn();
  } catch (_error) {
    return fallback;
  }
};

exports.getOverview = async (req, res) => {
  const city = req.query.city || 'Pune';
  const [geo, gdelt, weather, news, cdc, fda] = await Promise.all([
    safe(() => geocodeCity({ city }), { provider: 'OpenCage', configured: false, city, lat: 18.52, lng: 73.85 }),
    safe(() => fetchGdeltDiseaseNews({ country: req.query.country || 'India' }), { provider: 'GDELT', count: 0, articles: [] }),
    safe(() => fetchOpenMeteoWeather({ latitude: Number(req.query.lat) || 18.52, longitude: Number(req.query.lng) || 73.85 }), { provider: 'Open-Meteo', samples: [] }),
    safe(() => fetchNewsApi({ q: req.query.q || 'disease OR dengue OR flu' }), { provider: 'NewsAPI', configured: false, articles: [] }),
    safe(() => fetchCdcData(), { provider: 'CDC', count: 0, rows: [] }),
    safe(() => fetchOpenFdaDrugLabels({ search: req.query.drugSearch || 'fever' }), { provider: 'OpenFDA', total: 0, results: [] }),
  ]);

  return res.status(200).json({
    city,
    geocode: geo,
    gdelt,
    weather,
    news,
    cdc,
    openfda: fda,
    ai: {
      endpoint: 'https://api.openai.com/v1/chat/completions',
      configured: Boolean(process.env.OPENAI_API_KEY),
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    },
    bonus: {
      pytrends: 'Supported via Python integration',
      indiaDataPortal: 'https://data.gov.in/',
    },
  });
};
