const axios = require('axios');
const { getCached, setCached } = require('./cacheStore');

const TIMEOUT = 12000;

async function safeGet(url, config = {}) {
  try {
    const response = await axios.get(url, { timeout: TIMEOUT, ...config });
    return response.data;
  } catch (_error) {
    return null;
  }
}

/* ── disease.sh ─ Global COVID-19 data ────────────────────────────── */
async function fetchGlobalCovidSummary() {
  const cached = getCached('global-covid-summary');
  if (cached) return cached;
  const data = await safeGet('https://disease.sh/v3/covid-19/all');
  if (!data) return null;
  const result = {
    source: 'disease.sh',
    totalCases: data.cases || 0,
    todayCases: data.todayCases || 0,
    deaths: data.deaths || 0,
    todayDeaths: data.todayDeaths || 0,
    recovered: data.recovered || 0,
    active: data.active || 0,
    critical: data.critical || 0,
    testsPerMillion: data.testsPerOneMillion || 0,
    affectedCountries: data.affectedCountries || 0,
    updated: data.updated ? new Date(data.updated).toISOString() : new Date().toISOString(),
  };
  setCached('global-covid-summary', result, 10 * 60 * 1000);
  return result;
}

/* ── disease.sh ─ India-specific COVID data ───────────────────────── */
async function fetchIndiaCovidData() {
  const cached = getCached('india-covid-data');
  if (cached) return cached;
  const data = await safeGet('https://disease.sh/v3/covid-19/countries/india');
  if (!data) return null;
  const result = {
    source: 'disease.sh',
    country: 'India',
    cases: data.cases || 0,
    todayCases: data.todayCases || 0,
    deaths: data.deaths || 0,
    todayDeaths: data.todayDeaths || 0,
    recovered: data.recovered || 0,
    active: data.active || 0,
    critical: data.critical || 0,
    casesPerMillion: data.casesPerOneMillion || 0,
    deathsPerMillion: data.deathsPerOneMillion || 0,
    testsPerMillion: data.testsPerOneMillion || 0,
    population: data.population || 0,
    updated: data.updated ? new Date(data.updated).toISOString() : new Date().toISOString(),
  };
  setCached('india-covid-data', result, 10 * 60 * 1000);
  return result;
}

/* ── disease.sh ─ Historical timeline ─────────────────────────────── */
async function fetchCovidTimeline(days = 90) {
  const cacheKey = 'covid-timeline-' + days;
  const cached = getCached(cacheKey);
  if (cached) return cached;
  const data = await safeGet('https://disease.sh/v3/covid-19/historical/india?lastdays=' + days);
  if (!data || !data.timeline) return null;
  const cases = Object.entries(data.timeline.cases || {}).map(([date, value]) => ({ date, cases: value }));
  const deaths = Object.entries(data.timeline.deaths || {}).map(([date, value]) => ({ date, deaths: value }));
  const recovered = Object.entries(data.timeline.recovered || {}).map(([date, value]) => ({ date, recovered: value }));
  const result = { source: 'disease.sh', country: 'India', days, cases, deaths, recovered };
  setCached(cacheKey, result, 15 * 60 * 1000);
  return result;
}

/* ── disease.sh ─ Top affected countries ──────────────────────────── */
async function fetchTopCountries(limit = 15) {
  const cached = getCached('top-countries');
  if (cached) return cached;
  const data = await safeGet('https://disease.sh/v3/covid-19/countries?sort=cases&allowNull=false');
  if (!Array.isArray(data)) return null;
  const result = {
    source: 'disease.sh',
    countries: data.slice(0, limit).map((c) => ({
      country: c.country,
      cases: c.cases,
      todayCases: c.todayCases,
      deaths: c.deaths,
      recovered: c.recovered,
      active: c.active,
      casesPerMillion: c.casesPerOneMillion,
    })),
  };
  setCached('top-countries', result, 15 * 60 * 1000);
  return result;
}

/* ── WHO GHO ─ Health indicators for India ────────────────────────── */
async function fetchWhoIndicators() {
  const cached = getCached('who-indicators');
  if (cached) return cached;
  const indicatorCodes = [
    'WHOSIS_000001',
    'WHOSIS_000002',
    'MDG_0000000001',
    'WHS4_100',
    'MALARIA_EST_INCIDENCE',
    'NCD_BMI_30A',
    'WHS7_104',
    'WHS4_117',
  ];
  const results = await Promise.all(
    indicatorCodes.map(async (code) => {
      const url = 'https://ghoapi.azureedge.net/api/' + code + "?$filter=SpatialDim eq 'IND'&$top=5&$orderby=TimeDim desc";
      const data = await safeGet(url);
      const values = (data && data.value ? data.value : []).map((v) => ({
        indicator: v.IndicatorCode,
        year: v.TimeDim,
        value: v.NumericValue,
        dimension: v.Dim1 || null,
      }));
      return { code, values };
    })
  );
  const result = { source: 'WHO GHO', indicators: results.filter((r) => r.values.length > 0) };
  setCached('who-indicators', result, 6 * 60 * 60 * 1000);
  return result;
}

/* ── WHO GHO ─ Disease-specific indicator catalog ─────────────────── */
async function fetchWhoDiseaseData() {
  const cached = getCached('who-disease-data');
  if (cached) return cached;
  const response = await safeGet('https://ghoapi.azureedge.net/api/Indicator?$top=1000');
  const all = (response && response.value) ? response.value : [];
  const pattern = /dengue|malaria|tuberculosis|cholera|measles|hepatitis|hiv|covid|respiratory|diarrhea/i;
  const diseaseIndicators = all
    .filter((i) => pattern.test(i.IndicatorName || ''))
    .slice(0, 50)
    .map((i) => ({ code: i.IndicatorCode, name: i.IndicatorName, language: i.Language }));
  const result = { source: 'WHO GHO', totalScanned: all.length, diseaseIndicators };
  setCached('who-disease-data', result, 12 * 60 * 60 * 1000);
  return result;
}

/* ── World Bank ─ Health indicators for India ─────────────────────── */
async function fetchWorldBankHealthData() {
  const cached = getCached('worldbank-health');
  if (cached) return cached;
  const indicators = [
    { code: 'SH.DYN.MORT', label: 'Under-5 Mortality Rate' },
    { code: 'SH.TBS.INCD', label: 'TB Incidence (per 100k)' },
    { code: 'SH.XPD.CHEX.GD.ZS', label: 'Health Expenditure (% GDP)' },
    { code: 'SP.DYN.LE00.IN', label: 'Life Expectancy at Birth' },
    { code: 'SH.IMM.MEAS', label: 'Measles Immunization (%)' },
    { code: 'SH.STA.MMRT', label: 'Maternal Mortality Ratio' },
  ];
  const results = await Promise.all(
    indicators.map(async ({ code, label }) => {
      const url = 'https://api.worldbank.org/v2/country/IND/indicator/' + code + '?format=json&per_page=10&date=2015:2024';
      const data = await safeGet(url);
      const entries = (Array.isArray(data) && data[1]) ? data[1]
        .filter((d) => d.value !== null)
        .map((d) => ({ year: d.date, value: d.value }))
        : [];
      return { code, label, entries };
    })
  );
  const result = { source: 'World Bank', indicators: results.filter((r) => r.entries.length > 0) };
  setCached('worldbank-health', result, 6 * 60 * 60 * 1000);
  return result;
}

/* ── CDC ─ Health media and resources ─────────────────────────────── */
async function fetchCdcResources() {
  const cached = getCached('cdc-resources');
  if (cached) return cached;
  const data = await safeGet('https://tools.cdc.gov/api/v2/resources/media?max=15&topic=disease');
  const items = (data && data.results) ? data.results : [];
  const resources = items.map((r) => ({
    id: r.id,
    name: r.name,
    description: (r.description || '').replace(/<[^>]+>/g, '').slice(0, 200),
    sourceUrl: r.sourceUrl || '',
    datePublished: r.datePublished || '',
  }));
  const result = { source: 'CDC', count: resources.length, resources };
  setCached('cdc-resources', result, 60 * 60 * 1000);
  return result;
}

/* ── CDC ─ NNDSS Disease data ─────────────────────────────────────── */
async function fetchCdcDiseaseData() {
  const cached = getCached('cdc-disease-data');
  if (cached) return cached;
  const data = await safeGet('https://data.cdc.gov/resource/9bhg-hcku.json?$limit=50&$order=mmwr_year DESC');
  if (!Array.isArray(data)) return null;
  const result = {
    source: 'CDC NNDSS',
    count: data.length,
    records: data.slice(0, 30).map((r) => ({
      disease: r.label || r.disease || 'Unknown',
      year: r.mmwr_year || r.year,
      week: r.mmwr_week,
      cases: r.m1 || r.cases_this_week || r.current_week || 0,
      state: r.reporting_area || 'US',
    })),
  };
  setCached('cdc-disease-data', result, 60 * 60 * 1000);
  return result;
}

/* ── Open-Meteo ─ Environmental health data ───────────────────────── */
async function fetchEnvironmentalHealth(lat, lng) {
  lat = lat || 19.076;
  lng = lng || 72.877;
  const cacheKey = 'env-health-' + lat + '-' + lng;
  const cached = getCached(cacheKey);
  if (cached) return cached;
  const data = await safeGet('https://api.open-meteo.com/v1/forecast', {
    params: {
      latitude: lat,
      longitude: lng,
      hourly: 'temperature_2m,relativehumidity_2m,precipitation,windspeed_10m,uv_index',
      forecast_days: 3,
    },
  });
  if (!data) return null;
  const hourly = data.hourly || {};
  const temps = hourly.temperature_2m || [];
  const humidity = hourly.relativehumidity_2m || [];
  const precip = hourly.precipitation || [];
  const wind = hourly.windspeed_10m || [];
  const uv = hourly.uv_index || [];
  const avg = (arr) => arr.length ? Number((arr.reduce((s, v) => s + (Number(v) || 0), 0) / arr.length).toFixed(1)) : null;
  const result = {
    source: 'Open-Meteo',
    location: { lat, lng },
    current: {
      temperature: temps[0] || null,
      humidity: humidity[0] || null,
      precipitation: precip[0] || null,
      windSpeed: wind[0] || null,
      uvIndex: uv[0] || null,
    },
    averages: {
      temperature: avg(temps),
      humidity: avg(humidity),
      precipitation: avg(precip),
      windSpeed: avg(wind),
      uvIndex: avg(uv),
    },
    forecast: (hourly.time || []).filter(function (_, i) { return i % 6 === 0; }).slice(0, 12).map(function (time, i) {
      return {
        time: time,
        temperature: temps[i * 6] || null,
        humidity: humidity[i * 6] || null,
        precipitation: precip[i * 6] || null,
      };
    }),
  };
  setCached(cacheKey, result, 30 * 60 * 1000);
  return result;
}

/* ── NLM Clinical Tables ─ Disease conditions lookup ──────────────── */
async function fetchClinicalConditions(query) {
  query = query || 'infectious disease';
  const cacheKey = 'clinical-' + query;
  const cached = getCached(cacheKey);
  if (cached) return cached;
  const data = await safeGet('https://clinicaltables.nlm.nih.gov/api/conditions/v3/search?terms=' + encodeURIComponent(query) + '&maxList=15');
  if (!Array.isArray(data) || data.length < 4) return null;
  const result = {
    source: 'NLM Clinical Tables',
    total: data[0] || 0,
    conditions: (data[3] || []).map((c) => ({
      name: c[0] || 'Unknown',
      code: c[1] || null,
    })),
  };
  setCached(cacheKey, result, 24 * 60 * 60 * 1000);
  return result;
}

/* ── Aggregate all sources ────────────────────────────────────────── */
async function fetchAllGlobalHealthData() {
  const cached = getCached('all-global-health');
  if (cached) return cached;

  const settled = await Promise.allSettled([
    fetchGlobalCovidSummary(),
    fetchIndiaCovidData(),
    fetchCovidTimeline(90),
    fetchTopCountries(15),
    fetchWhoIndicators(),
    fetchWhoDiseaseData(),
    fetchWorldBankHealthData(),
    fetchCdcResources(),
    fetchCdcDiseaseData(),
    fetchEnvironmentalHealth(),
    fetchClinicalConditions('infectious disease'),
  ]);

  const val = (i) => (settled[i].status === 'fulfilled' ? settled[i].value : null);

  const globalCovid = val(0);
  const indiaCovid = val(1);
  const covidTimeline = val(2);
  const topCountries = val(3);
  const whoIndicators = val(4);
  const whoDiseases = val(5);
  const worldBankHealth = val(6);
  const cdcResources = val(7);
  const cdcDiseaseData = val(8);
  const envHealth = val(9);
  const clinicalConditions = val(10);

  const activeSources = [
    globalCovid && 'disease.sh',
    whoIndicators && 'WHO GHO',
    worldBankHealth && 'World Bank',
    cdcResources && 'CDC',
    cdcDiseaseData && 'CDC NNDSS',
    envHealth && 'Open-Meteo',
    clinicalConditions && 'NLM',
  ].filter(Boolean);

  const result = {
    lastUpdated: new Date().toISOString(),
    activeSources: activeSources,
    sourceCount: activeSources.length,
    globalCovid: globalCovid,
    indiaCovid: indiaCovid,
    covidTimeline: covidTimeline,
    topCountries: topCountries,
    whoIndicators: whoIndicators,
    whoDiseases: whoDiseases,
    worldBankHealth: worldBankHealth,
    cdcResources: cdcResources,
    cdcDiseaseData: cdcDiseaseData,
    environmentalHealth: envHealth,
    clinicalConditions: clinicalConditions,
  };

  setCached('all-global-health', result, 10 * 60 * 1000);
  return result;
}

module.exports = {
  fetchGlobalCovidSummary,
  fetchIndiaCovidData,
  fetchCovidTimeline,
  fetchTopCountries,
  fetchWhoIndicators,
  fetchWhoDiseaseData,
  fetchWorldBankHealthData,
  fetchCdcResources,
  fetchCdcDiseaseData,
  fetchEnvironmentalHealth,
  fetchClinicalConditions,
  fetchAllGlobalHealthData,
};
