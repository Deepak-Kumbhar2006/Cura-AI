const axios = require('axios');
const { getCached, setCached } = require('./cacheStore');

const DISEASES = ['dengue', 'flu', 'covid', 'malaria'];

function riskFromScore(score) {
  if (score >= 70) return 'High';
  if (score >= 40) return 'Medium';
  return 'Low';
}

async function fetchGdeltCounts({ query = 'disease OR dengue OR flu OR covid' } = {}) {
  const cacheKey = `gdelt:${query}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;
  const endpoint = process.env.GDELT_API_URL || 'https://api.gdeltproject.org/api/v2/doc/doc';
  const { data } = await axios.get(endpoint, {
    params: { query, mode: 'ArtList', format: 'json', maxrecords: 120 },
    timeout: 12000,
  });

  const articles = data?.articles || [];
  const counts = DISEASES.reduce((acc, d) => ({ ...acc, [d]: 0 }), {});
  for (const article of articles) {
    const text = `${article?.title || ''} ${article?.sourcecountry || ''}`.toLowerCase();
    for (const d of DISEASES) {
      if (text.includes(d)) counts[d] += 1;
    }
  }

  const result = { counts, articles: articles.slice(0, 15) };
  setCached(cacheKey, result, 10 * 60 * 1000);
  return result;
}

async function fetchOpenMeteo(lat, lng) {
  const endpoint = process.env.OPEN_METEO_URL || 'https://api.open-meteo.com/v1/forecast';
  const { data } = await axios.get(endpoint, {
    params: {
      latitude: lat,
      longitude: lng,
      hourly: 'temperature_2m,relative_humidity_2m,precipitation',
      forecast_days: 1,
    },
    timeout: 12000,
  });

  return {
    temperature: Number(data?.hourly?.temperature_2m?.[0] ?? 0),
    humidity: Number(data?.hourly?.relative_humidity_2m?.[0] ?? 0),
    precipitation: Number(data?.hourly?.precipitation?.[0] ?? 0),
  };
}

async function fetchCdcSignal() {
  const cached = getCached('cdc:signal');
  if (cached != null) return cached;
  try {
    const { data } = await axios.get('https://data.cdc.gov/resource/9mfq-cb36.json?$limit=1000', { timeout: 12000 });
    const signal = Array.isArray(data) ? data.length : 0;
    setCached('cdc:signal', signal, 60 * 60 * 1000);
    return signal;
  } catch (_e) {
    return 0;
  }
}

async function fetchNewsApiSignal() {
  if (!process.env.NEWSAPI_KEY) return 0;
  const cached = getCached('newsapi:signal');
  if (cached != null) return cached;
  try {
    const { data } = await axios.get('https://newsapi.org/v2/everything', {
      params: { q: 'disease OR dengue OR flu OR covid', apiKey: process.env.NEWSAPI_KEY, pageSize: 50 },
      timeout: 12000,
    });
    const total = Number(data?.totalResults || 0);
    setCached('newsapi:signal', total, 30 * 60 * 1000);
    return total;
  } catch (_e) {
    return 0;
  }
}

function buildTrends({ counts, weather, cdcSignal, newsApiSignal, location }) {
  const trends = DISEASES.map((disease) => {
    const newsScore = Math.min((counts[disease] || 0) * 7, 45);
    const weatherScore = disease === 'dengue'
      ? Math.min(Math.max(weather.humidity - 60, 0), 25) + Math.min(weather.precipitation * 6, 15)
      : Math.min(Math.max(weather.temperature - 18, 0), 20);
    const cdcScore = Math.min(cdcSignal / 60, 15);
    const newsApiScore = Math.min(newsApiSignal / 500, 10);
    const score = Math.round(Math.min(newsScore + weatherScore + cdcScore + newsApiScore, 100));

    return {
      disease,
      score,
      risk: riskFromScore(score),
      reason: `gdelt=${counts[disease] || 0}, cdc=${cdcSignal}, newsapi=${newsApiSignal}, temp=${weather.temperature}, humidity=${weather.humidity}, precip=${weather.precipitation}`,
      location,
    };
  });

  return trends.sort((a, b) => b.score - a.score);
}

module.exports = { fetchGdeltCounts, fetchOpenMeteo, fetchCdcSignal, fetchNewsApiSignal, buildTrends };
