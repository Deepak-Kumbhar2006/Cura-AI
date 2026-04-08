const axios = require('axios');
const signalCache = new Map();
const SIGNAL_TTL_MS = 10 * 60 * 1000;

async function fetchGdeltDiseaseNews({ query = 'disease OR dengue OR flu OR covid OR malaria', country = 'India' } = {}) {
  const combined = `${query} AND ${country}`;
  const { data } = await axios.get('https://api.gdeltproject.org/api/v2/doc/doc', {
    params: {
      query: combined,
      mode: 'ArtList',
      format: 'json',
      maxrecords: 15,
    },
    timeout: 10000,
  });

  const articles = (data?.articles || []).map((a) => ({
    title: a.title,
    source: a.sourcecountry || a.domain || 'Unknown',
    url: a.url,
    language: a.language,
    tone: a.seendate || '',
  }));
  return { provider: 'GDELT', count: articles.length, articles };
}

async function fetchOpenMeteoWeather({ latitude = 18.52, longitude = 73.85 } = {}) {
  const { data } = await axios.get('https://api.open-meteo.com/v1/forecast', {
    params: {
      latitude,
      longitude,
      hourly: 'temperature_2m,precipitation,relativehumidity_2m',
      forecast_days: 1,
    },
    timeout: 8000,
  });
  const hourly = data?.hourly || {};
  return {
    provider: 'Open-Meteo',
    latitude,
    longitude,
    samples: (hourly.time || []).slice(0, 24).map((t, i) => ({
      time: t,
      temperature: hourly.temperature_2m?.[i],
      precipitation: hourly.precipitation?.[i],
      humidity: hourly.relativehumidity_2m?.[i],
    })),
  };
}

async function fetchNewsApi({ q = 'disease OR dengue OR flu' } = {}) {
  const key = process.env.NEWS_API_KEY;
  if (!key) return { provider: 'NewsAPI', configured: false, articles: [] };
  const { data } = await axios.get('https://newsapi.org/v2/everything', {
    params: { q, apiKey: key, pageSize: 10, language: 'en', sortBy: 'publishedAt' },
    timeout: 8000,
  });
  return {
    provider: 'NewsAPI',
    configured: true,
    articles: (data.articles || []).map((a) => ({
      title: a.title,
      source: a.source?.name || 'Unknown',
      url: a.url,
      publishedAt: a.publishedAt,
    })),
  };
}

async function fetchCdcData() {
  const { data } = await axios.get('https://data.cdc.gov/resource/9mfq-cb36.json', { timeout: 10000 });
  return { provider: 'CDC', count: data.length, rows: data.slice(0, 20) };
}

async function fetchOpenFdaDrugLabels({ search = 'fever' } = {}) {
  const { data } = await axios.get('https://api.fda.gov/drug/label.json', {
    params: { search: `indications_and_usage:${search}`, limit: 10 },
    timeout: 10000,
  });
  return {
    provider: 'OpenFDA',
    total: data.meta?.results?.total || 0,
    results: (data.results || []).map((r) => ({
      brandName: r.openfda?.brand_name?.[0] || 'Unknown',
      genericName: r.openfda?.generic_name?.[0] || 'Unknown',
      manufacturer: r.openfda?.manufacturer_name?.[0] || 'Unknown',
    })),
  };
}

async function geocodeCity({ city = 'Pune' } = {}) {
  const key = process.env.OPENCAGE_API_KEY;
  if (!key) return { provider: 'OpenCage', configured: false, city, lat: 18.52, lng: 73.85 };

  const { data } = await axios.get('https://api.opencagedata.com/geocode/v1/json', {
    params: { q: city, key, limit: 1 },
    timeout: 8000,
  });
  const first = data?.results?.[0];
  return {
    provider: 'OpenCage',
    configured: true,
    city,
    lat: first?.geometry?.lat ?? null,
    lng: first?.geometry?.lng ?? null,
    formatted: first?.formatted ?? '',
  };
}

function scoreExternalSignals({ gdeltCount = 0, humidity = 0, symptomNames = [] }) {
  const normalizedSymptoms = new Set(symptomNames.map((s) => String(s).toLowerCase()));
  const hasRespiratory = normalizedSymptoms.has('cough') || normalizedSymptoms.has('breathing issues');
  const hasFever = normalizedSymptoms.has('fever');

  let boost = 0;
  if (gdeltCount >= 12) boost += 0.12;
  else if (gdeltCount >= 7) boost += 0.07;

  if (humidity >= 75) boost += 0.08;
  if (hasFever && hasRespiratory) boost += 0.08;
  if (hasFever && gdeltCount >= 7) boost += 0.05;

  const externalRisk = boost >= 0.22 ? 'High' : boost >= 0.12 ? 'Medium' : 'Low';
  return { boost: Number(boost.toFixed(2)), externalRisk };
}

async function getExternalRiskSignals({ city = 'Pune', country = 'India', humidity = 60, symptomNames = [] } = {}) {
  const key = `${String(city).toLowerCase()}::${String(country).toLowerCase()}`;
  const cached = signalCache.get(key);
  if (cached && Date.now() - cached.at < SIGNAL_TTL_MS) {
    const scored = scoreExternalSignals({ gdeltCount: cached.gdeltCount, humidity, symptomNames });
    return { ...cached.payload, ...scored, cached: true };
  }

  const [gdelt, weather] = await Promise.all([
    fetchGdeltDiseaseNews({ country }).catch(() => ({ count: 0, articles: [] })),
    fetchOpenMeteoWeather().catch(() => ({ samples: [] })),
  ]);

  const avgHumidity = (weather.samples || []).length
    ? Math.round(weather.samples.reduce((acc, cur) => acc + (Number(cur.humidity) || 0), 0) / weather.samples.length)
    : humidity;

  const payload = {
    city,
    country,
    gdeltCount: gdelt.count || 0,
    gdeltTopHeadlines: (gdelt.articles || []).slice(0, 3).map((a) => a.title).filter(Boolean),
    meteoAvgHumidity: avgHumidity,
  };
  signalCache.set(key, { at: Date.now(), gdeltCount: payload.gdeltCount, payload });
  const scored = scoreExternalSignals({ gdeltCount: payload.gdeltCount, humidity: avgHumidity || humidity, symptomNames });
  return { ...payload, ...scored, cached: false };
}

module.exports = {
  fetchGdeltDiseaseNews,
  fetchOpenMeteoWeather,
  fetchNewsApi,
  fetchCdcData,
  fetchOpenFdaDrugLabels,
  geocodeCity,
  getExternalRiskSignals,
};
