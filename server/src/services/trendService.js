const axios = require('axios');

const DISEASES = ['dengue', 'flu', 'covid', 'malaria'];

function riskFromScore(score) {
  if (score >= 70) return 'High';
  if (score >= 40) return 'Medium';
  return 'Low';
}

async function fetchGdeltCounts({ query = 'disease OR dengue OR flu OR covid' } = {}) {
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

  return { counts, articles: articles.slice(0, 15) };
}

async function fetchOpenMeteo(lat, lng) {
  const { data } = await axios.get('https://api.open-meteo.com/v1/forecast', {
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
  try {
    const { data } = await axios.get('https://data.cdc.gov/resource/9mfq-cb36.json?$limit=1000', { timeout: 12000 });
    return Array.isArray(data) ? data.length : 0;
  } catch (_e) {
    return 0;
  }
}

function buildTrends({ counts, weather, cdcSignal, location }) {
  const trends = DISEASES.map((disease) => {
    const newsScore = Math.min((counts[disease] || 0) * 7, 45);
    const weatherScore = disease === 'dengue'
      ? Math.min(Math.max(weather.humidity - 60, 0), 25) + Math.min(weather.precipitation * 6, 15)
      : Math.min(Math.max(weather.temperature - 18, 0), 20);
    const cdcScore = Math.min(cdcSignal / 60, 20);
    const score = Math.round(Math.min(newsScore + weatherScore + cdcScore, 100));

    return {
      disease,
      score,
      risk: riskFromScore(score),
      reason: `news=${counts[disease] || 0}, temp=${weather.temperature}, humidity=${weather.humidity}, precip=${weather.precipitation}`,
      location,
    };
  });

  return trends.sort((a, b) => b.score - a.score);
}

module.exports = { fetchGdeltCounts, fetchOpenMeteo, fetchCdcSignal, buildTrends };
