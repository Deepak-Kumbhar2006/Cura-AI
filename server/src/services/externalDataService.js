const axios = require('axios');
const signalCache = new Map();
const SIGNAL_TTL_MS = 10 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 8000;

const DEFAULT_OUTBREAK_SOURCES = [
  'https://api.data.gov.in/resource/health-management-information-system-hmis-india',
  'https://api.data.gov.in/resource/integrated-disease-surveillance-programme-idsp',
  'https://api.data.gov.in/resource/disease-wise-cases-and-deaths-india',
  'https://api.data.gov.in/resource/state-wise-health-indicators-india',
  'https://api.who.int/data/gho',
  'https://apps.who.int/gho/athena/api/GHO',
  'https://ghoapi.azureedge.net/api/IndicatorData',
  'https://api.worldbank.org/v2/country/IND/indicator/SH.DYN.MORT',
  'https://api.worldbank.org/v2/country/IND/indicator/SH.TBS.INCD',
  'https://api.openaq.org/v2/latest?country=IN',
  'https://api.covid19api.com/dayone/country/india',
  'https://api.covid19api.com/summary',
  'https://disease.sh/v3/covid-19/countries/india',
  'https://disease.sh/v3/covid-19/historical/india',
  'https://api.healthmap.org/outbreaks',
  'https://api.healthmap.org/v1/alerts',
  'https://api.healthmap.org/v1/outbreaks',
  'https://api.humdata.org/v1/data?tags=health',
  'https://api.humdata.org/v1/data?tags=disease',
  'https://api.humdata.org/v1/data?tags=epidemic',
  'https://api.humdata.org/v1/data?tags=outbreak',
  'https://api.fda.gov/drug/event.json',
  'https://api.fda.gov/drug/label.json',
  'https://api.fda.gov/device/event.json',
  'https://epidata.cdc.gov/EpiData/api/fluview',
  'https://epidata.cdc.gov/EpiData/api/covidcast',
  'https://epidata.cdc.gov/EpiData/api/dengue',
  'https://api.ecdc.europa.eu/covid19/casedistribution/json',
  'https://api.ecdc.europa.eu/influenza',
  'https://clinicaltrials.gov/api/query/study_fields',
  'https://clinicaltrials.gov/api/query/full_studies',
];

const GOV_DOMAINS = ['.gov', '.gov.in', 'who.int', 'worldbank.org', 'cdc.gov'];
const KEYWORDS = {
  cases: ['case', 'cases', 'incidence', 'new_cases', 'confirmed'],
  deaths: ['death', 'deaths', 'mortality', 'fatal'],
  tests: ['test', 'tests', 'positivity'],
  hospital: ['admission', 'hospital', 'icu', 'bed'],
  outbreak: ['outbreak', 'alert', 'epidemic', 'cluster'],
};

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

function flattenNumbers(input, path = '', out = []) {
  if (input === null || input === undefined) return out;
  if (typeof input === 'number' && Number.isFinite(input)) {
    out.push({ path, value: input });
    return out;
  }
  if (Array.isArray(input)) {
    input.forEach((v, i) => flattenNumbers(v, `${path}[${i}]`, out));
    return out;
  }
  if (typeof input === 'object') {
    Object.entries(input).forEach(([k, v]) => flattenNumbers(v, path ? `${path}.${k}` : k, out));
  }
  return out;
}

function scoreReliability(url) {
  const host = new URL(url).hostname.toLowerCase();
  if (GOV_DOMAINS.some((d) => host.endsWith(d) || host.includes(d))) return 1;
  if (host.includes('data.') || host.includes('health')) return 0.8;
  return 0.6;
}

function sumByKeywords(flat, keywords) {
  return flat
    .filter((item) => keywords.some((k) => item.path.toLowerCase().includes(k)))
    .slice(0, 200)
    .reduce((acc, item) => acc + item.value, 0);
}

function normalizeHealthSignal(url, raw) {
  const flat = flattenNumbers(raw);
  const cases = sumByKeywords(flat, KEYWORDS.cases);
  const deaths = sumByKeywords(flat, KEYWORDS.deaths);
  const tests = sumByKeywords(flat, KEYWORDS.tests);
  const hospitalLoad = sumByKeywords(flat, KEYWORDS.hospital);
  const outbreaks = sumByKeywords(flat, KEYWORDS.outbreak);
  return {
    url,
    reliability: scoreReliability(url),
    extracted: { cases, deaths, tests, hospitalLoad, outbreaks },
    datapoints: flat.length,
  };
}

function computeOutbreakPrediction(signals, context = {}) {
  if (!signals.length) {
    return {
      score: 0,
      risk: 'Unknown',
      confidence: 0.1,
      explanation: ['No external sources could be parsed.'],
    };
  }

  const weighted = signals.reduce(
    (acc, s) => {
      const w = s.reliability;
      acc.weight += w;
      acc.cases += s.extracted.cases * w;
      acc.deaths += s.extracted.deaths * w;
      acc.outbreaks += s.extracted.outbreaks * w;
      acc.hospitalLoad += s.extracted.hospitalLoad * w;
      return acc;
    },
    { weight: 0, cases: 0, deaths: 0, outbreaks: 0, hospitalLoad: 0 },
  );

  const norm = (v) => Math.log10(v + 1);
  const baseScore =
    norm(weighted.cases / (weighted.weight || 1)) * 35 +
    norm(weighted.deaths / (weighted.weight || 1)) * 25 +
    norm(weighted.outbreaks / (weighted.weight || 1)) * 25 +
    norm(weighted.hospitalLoad / (weighted.weight || 1)) * 15;

  const score = Number(Math.max(0, Math.min(100, baseScore * 6)).toFixed(1));
  const risk = score >= 70 ? 'High' : score >= 40 ? 'Medium' : 'Low';
  const confidence = Number(Math.min(0.95, 0.25 + signals.length * 0.03).toFixed(2));

  return {
    score,
    risk,
    confidence,
    explanation: [
      `Signals processed from ${signals.length} sources.`,
      `Region: ${context.region || 'India'}. Disease focus: ${context.disease || 'all'}.`,
      'Score blends cases, deaths, outbreak mentions, and hospital load with source reliability weights.',
    ],
  };
}

async function fetchAnyJson(url) {
  const { data } = await axios.get(url, { timeout: REQUEST_TIMEOUT_MS });
  return data;
}

async function buildOutbreakPrediction({ sources = DEFAULT_OUTBREAK_SOURCES, region = 'India', disease = 'all' } = {}) {
  const uniqueSources = [...new Set((Array.isArray(sources) ? sources : DEFAULT_OUTBREAK_SOURCES).filter(Boolean))];
  const results = await Promise.allSettled(uniqueSources.map((url) => fetchAnyJson(url)));

  const signals = [];
  const failed = [];

  results.forEach((result, idx) => {
    const url = uniqueSources[idx];
    if (result.status === 'fulfilled') {
      signals.push(normalizeHealthSignal(url, result.value));
    } else {
      failed.push({ url, reason: result.reason?.message || 'Request failed' });
    }
  });

  const prediction = computeOutbreakPrediction(signals, { region, disease });
  return {
    region,
    disease,
    sourcesRequested: uniqueSources.length,
    sourcesUsed: signals.length,
    failedSources: failed.slice(0, 25),
    prediction,
    topSignals: signals
      .sort((a, b) => (b.extracted.cases + b.extracted.outbreaks) - (a.extracted.cases + a.extracted.outbreaks))
      .slice(0, 12),
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
  DEFAULT_OUTBREAK_SOURCES,
  buildOutbreakPrediction,
};
