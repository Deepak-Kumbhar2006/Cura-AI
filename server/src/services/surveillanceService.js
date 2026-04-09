const axios = require('axios');

const cache = new Map();

const REGION_META = {
  Maharashtra: { city: 'Mumbai', lat: 19.076, lng: 72.8777, populationDensity: 365 },
  Delhi: { city: 'Delhi', lat: 28.6139, lng: 77.209, populationDensity: 11320 },
  Karnataka: { city: 'Bengaluru', lat: 12.9716, lng: 77.5946, populationDensity: 319 },
  Gujarat: { city: 'Ahmedabad', lat: 23.0225, lng: 72.5714, populationDensity: 308 },
  'Tamil Nadu': { city: 'Chennai', lat: 13.0827, lng: 80.2707, populationDensity: 555 },
  Rajasthan: { city: 'Jaipur', lat: 26.9124, lng: 75.7873, populationDensity: 201 },
  'Uttar Pradesh': { city: 'Lucknow', lat: 26.8467, lng: 80.9462, populationDensity: 828 },
  Telangana: { city: 'Hyderabad', lat: 17.385, lng: 78.4867, populationDensity: 312 },
  'West Bengal': { city: 'Kolkata', lat: 22.5726, lng: 88.3639, populationDensity: 1029 },
  Kerala: { city: 'Thiruvananthapuram', lat: 8.5241, lng: 76.9366, populationDensity: 860 },
};

function getCache(key) {
  const cached = cache.get(key);
  if (!cached) return null;
  if (Date.now() > cached.expiresAt) {
    cache.delete(key);
    return null;
  }
  return cached.data;
}

function setCache(key, data, ttlMs) {
  cache.set(key, { data, expiresAt: Date.now() + ttlMs });
  return data;
}

async function safeGet(url, config = {}) {
  try {
    const response = await axios.get(url, { timeout: 15000, ...config });
    return response.data;
  } catch (_error) {
    return null;
  }
}

function parseDiseaseShDate(dateLabel) {
  const [month, day, year] = String(dateLabel).split('/').map((part) => Number(part));
  if (!month || !day || !year) return null;
  const yyyy = year < 100 ? 2000 + year : year;
  return new Date(Date.UTC(yyyy, month - 1, day)).toISOString().slice(0, 10);
}

async function fetchCovidIndiaData() {
  const cacheKey = 'covid-india-full';
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const [historical, stateData] = await Promise.all([
    safeGet('https://disease.sh/v3/covid-19/historical/india?lastdays=120'),
    safeGet('https://disease.sh/v3/covid-19/gov/India'),
  ]);

  const timelineCases = Object.entries(historical?.timeline?.cases || {})
    .map(([date, cases]) => ({ date: parseDiseaseShDate(date), cases: Number(cases || 0) }))
    .filter((row) => row.date)
    .sort((a, b) => a.date.localeCompare(b.date));

  const regions = (stateData?.states || []).map((state) => {
    const meta = REGION_META[state.state] || {};
    return {
      region: state.state,
      city: meta.city || state.state,
      totalCases: Number(state.cases || 0),
      activeCases: Number(state.active || 0),
      recovered: Number(state.discharged || 0),
      deaths: Number(state.deaths || 0),
      lat: meta.lat ?? null,
      lng: meta.lng ?? null,
      populationDensity: meta.populationDensity ?? null,
      source: 'disease.sh',
    };
  });

  const normalized = {
    totals: {
      totalCases: Number(stateData?.total?.confirmed || timelineCases.at(-1)?.cases || 0),
      activeCases: Number(stateData?.total?.active || 0),
      recoveries: Number(stateData?.total?.discharged || 0),
      deaths: Number(stateData?.total?.deaths || 0),
    },
    timelineCases,
    regions,
  };

  return setCache(cacheKey, normalized, 10 * 60 * 1000);
}

async function fetchWhoSignals() {
  const cacheKey = 'who-signals';
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const response = await safeGet('https://ghoapi.azureedge.net/api/Indicator?$top=800');
  const allIndicators = response?.value || [];
  const filtered = allIndicators
    .filter((item) => /dengue|malaria|covid|respiratory|communicable/i.test(item.IndicatorName || ''))
    .slice(0, 30)
    .map((item) => ({
      indicator: item.IndicatorName,
      code: item.IndicatorCode,
      source: 'WHO GHO',
    }));

  return setCache(cacheKey, { scanned: allIndicators.length, indicators: filtered }, 6 * 60 * 60 * 1000);
}

async function fetchIdspAlerts() {
  const cacheKey = 'idsp-alerts';
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const html = await safeGet('https://idsp.nic.in/index4.php?lang=1&level=0&linkid=406&lid=3689', {
    responseType: 'text',
    transformResponse: [(value) => value],
  });

  if (!html || typeof html !== 'string') return setCache(cacheKey, [], 30 * 60 * 1000);

  const rows = [...html.matchAll(/<tr[^>]*>\s*<td[^>]*>(.*?)<\/td>\s*<td[^>]*>(.*?)<\/td>\s*<td[^>]*>(.*?)<\/td>/gis)]
    .map((match) => {
      const disease = String(match[1] || '').replace(/<[^>]+>/g, '').trim();
      const region = String(match[2] || '').replace(/<[^>]+>/g, '').trim();
      const timestamp = String(match[3] || '').replace(/<[^>]+>/g, '').trim() || new Date().toISOString();
      if (!disease || !region) return null;
      const severity = /cholera|encephalitis|diphtheria|avian|measles|unknown/i.test(disease) ? 'high' : 'medium';
      return { disease, region, severity, timestamp, source: 'IDSP' };
    })
    .filter(Boolean)
    .slice(0, 30);

  return setCache(cacheKey, rows, 30 * 60 * 1000);
}

async function fetchDataGovRecords() {
  const cacheKey = 'data-gov-health';
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const apiKey = process.env.DATA_GOV_API_KEY || '579b464db66ec23bdd00000129253b79e5fda45f57cfb5abdccf7df5';
  const resourceId = process.env.DATA_GOV_HEALTH_RESOURCE_ID;
  if (!resourceId) return setCache(cacheKey, { configured: false, records: [] }, 60 * 60 * 1000);

  const payload = await safeGet(`https://api.data.gov.in/resource/${resourceId}`, {
    params: { 'api-key': apiKey, format: 'json', limit: 100 },
  });

  const records = (payload?.records || []).map((row) => ({
    disease: row.disease || row.disease_name || row.Disease || 'Unknown',
    region: row.state || row.State || row.region || 'Unknown',
    cases: Number(row.cases || row.value || row.count || 0),
    date: row.date || row.month || row.year || null,
    source: 'data.gov.in',
  }));

  return setCache(cacheKey, { configured: true, records }, 60 * 60 * 1000);
}

async function fetchEnvironmentBatch(regions) {
  const cacheKey = 'environment-batch';
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const aqiToken = process.env.AQICN_API_KEY;

  const data = await Promise.all(
    regions.slice(0, 12).map(async (region) => {
      if (!region.lat || !region.lng) return { region: region.region, humidity: null, temperature: null, aqi: null, aqiLevel: 'unknown' };
      const [weather, aqiResponse] = await Promise.all([
        safeGet('https://api.open-meteo.com/v1/forecast', {
          params: {
            latitude: region.lat,
            longitude: region.lng,
            hourly: 'temperature_2m,relativehumidity_2m',
            forecast_days: 1,
          },
        }),
        aqiToken ? safeGet(`https://api.waqi.info/feed/geo:${region.lat};${region.lng}/`, { params: { token: aqiToken } }) : null,
      ]);

      const humiditySeries = weather?.hourly?.relativehumidity_2m || [];
      const tempSeries = weather?.hourly?.temperature_2m || [];
      const humidity = humiditySeries.length
        ? Number((humiditySeries.reduce((sum, value) => sum + Number(value || 0), 0) / humiditySeries.length).toFixed(1))
        : null;
      const temperature = tempSeries.length
        ? Number((tempSeries.reduce((sum, value) => sum + Number(value || 0), 0) / tempSeries.length).toFixed(1))
        : null;
      const aqi = Number(aqiResponse?.data?.aqi || 0) || null;
      const aqiLevel = aqi === null ? 'unknown' : aqi > 150 ? 'high' : aqi > 80 ? 'medium' : 'low';

      return {
        region: region.region,
        humidity,
        temperature,
        aqi,
        aqiLevel,
      };
    })
  );

  return setCache(cacheKey, data, 20 * 60 * 1000);
}

function computeGrowthPercent(series) {
  const last = series.at(-1);
  const weekBack = series.at(-8);
  if (!last || !weekBack || weekBack.cases <= 0) return 0;
  return Number((((last.cases - weekBack.cases) / weekBack.cases) * 100).toFixed(2));
}

function computeRiskScore(region, env, growthPct, pastAlertsCount) {
  const activeComponent = Math.min(35, (region.activeCases / Math.max(region.totalCases, 1)) * 1000);
  const growthComponent = Math.min(25, Math.max(0, growthPct));
  const humidityComponent = env?.humidity ? Math.min(15, Math.max(0, (env.humidity - 55) * 0.6)) : 5;
  const densityComponent = region.populationDensity ? Math.min(15, region.populationDensity / 200) : 6;
  const outbreakComponent = Math.min(10, pastAlertsCount * 1.4);
  const aqiComponent = env?.aqi ? Math.min(10, env.aqi / 40) : 4;

  return Number((activeComponent + growthComponent + humidityComponent + densityComponent + outbreakComponent + aqiComponent).toFixed(1));
}

function riskLevelFromScore(score) {
  if (score >= 70) return 'high';
  if (score >= 45) return 'medium';
  return 'low';
}

function deriveDiseaseDistribution(covidTotals, dataGovRecords, alerts) {
  const dengueCases = dataGovRecords.filter((r) => /dengue/i.test(r.disease)).reduce((sum, item) => sum + item.cases, 0) + alerts.filter((a) => /dengue/i.test(a.disease)).length * 3;
  const malariaCases = dataGovRecords.filter((r) => /malaria/i.test(r.disease)).reduce((sum, item) => sum + item.cases, 0) + alerts.filter((a) => /malaria/i.test(a.disease)).length * 3;

  return [
    { disease: 'COVID-19', cases: covidTotals.totalCases, source: 'disease.sh' },
    { disease: 'Dengue', cases: dengueCases, source: 'data.gov.in + IDSP' },
    { disease: 'Malaria', cases: malariaCases, source: 'data.gov.in + IDSP' },
  ].filter((row) => Number(row.cases) > 0);
}

function buildAgeRiskFromRiskScores(regionScores) {
  const avgRisk = regionScores.length
    ? regionScores.reduce((sum, item) => sum + item.riskScore, 0) / regionScores.length
    : 30;

  const child = Math.min(100, Number((avgRisk * 0.52).toFixed(1)));
  const youth = Math.min(100, Number((avgRisk * 0.74).toFixed(1)));
  const adult = Math.min(100, Number((avgRisk * 0.93).toFixed(1)));
  const senior = Math.min(100, Number((avgRisk * 1.08).toFixed(1)));

  return [
    { ageGroup: '0-17', riskIndex: child },
    { ageGroup: '18-35', riskIndex: youth },
    { ageGroup: '36-59', riskIndex: adult },
    { ageGroup: '60+', riskIndex: senior },
  ];
}

function buildPredictions(regionScores, growthPct, { casesMultiplier = 1, vaccinationRate = 0 } = {}) {
  const normalizedCasesMultiplier = Number.isFinite(casesMultiplier) ? Math.max(0.5, Math.min(3, casesMultiplier)) : 1;
  const normalizedVaccinationRate = Number.isFinite(vaccinationRate) ? Math.max(0, Math.min(95, vaccinationRate)) : 0;

  return regionScores.slice(0, 8).map((region) => {
    const growthFactor = 1 + (growthPct > 0 ? growthPct : 3) / 100;
    const vaccinationSuppression = Math.max(0.7, 1 - normalizedVaccinationRate / 200);
    const projectedSpike = Number((region.activeCases * growthFactor * normalizedCasesMultiplier * vaccinationSuppression).toFixed(0));
    const confidence = Math.min(96, Math.max(61, Math.round(62 + region.riskScore / 2)));
    const uncertaintyRange = {
      lower: Math.max(0, Math.round(projectedSpike * 0.87)),
      upper: Math.round(projectedSpike * 1.14),
    };

    return {
      region: region.region,
      disease: region.humidity > 68 ? 'Dengue' : 'COVID-19',
      predictedActiveCases7d: projectedSpike,
      riskScore: region.riskScore,
      level: region.riskLevel,
      confidence,
      uncertaintyRange,
      rationale: region.humidity > 68
        ? `High humidity (${region.humidity}%) and elevated risk score indicate vector-borne spread potential.`
        : `Active-case pressure and trend growth indicate respiratory spread pressure.`,
    };
  });
}

function detectAnomalies(series = []) {
  const window = series.slice(-21);
  if (window.length < 10) return [];

  const deltas = window.map((row, idx) => {
    const prev = window[idx - 1];
    return prev ? Math.max(0, row.cases - prev.cases) : 0;
  }).slice(1);

  const mean = deltas.reduce((sum, x) => sum + x, 0) / deltas.length;
  const variance = deltas.reduce((sum, x) => sum + (x - mean) ** 2, 0) / deltas.length;
  const std = Math.sqrt(variance || 1);
  const latest = deltas.at(-1) || 0;
  const z = Number(((latest - mean) / std).toFixed(2));

  if (z < 2.2) return [];
  return [{
    type: 'anomaly',
    message: `Unusual spike detected in latest daily cases (${latest} vs avg ${Math.round(mean)}).`,
    zScore: z,
    severity: z > 3 ? 'high' : 'medium',
  }];
}

function generateEarlyWarnings(regionScores, growthPct) {
  return regionScores
    .filter((region) => region.humidity !== null && region.humidity >= 70 && growthPct > 0 && region.riskScore >= 55)
    .slice(0, 5)
    .map((region) => ({
      region: region.region,
      disease: region.humidity >= 72 ? 'Dengue' : 'Respiratory Illness',
      window: 'next 5-7 days',
      confidence: Math.min(95, Math.round(66 + region.riskScore / 3)),
      message: `Potential ${region.humidity >= 72 ? 'Dengue' : 'respiratory'} outbreak in ${region.region} in next 5-7 days.`,
    }));
}

function enrichSmartAlerts(alerts, regionScores) {
  const byRegion = Object.fromEntries(regionScores.map((row) => [row.region, row]));
  return alerts.map((alert) => {
    const context = byRegion[alert.region];
    const recommendedActions = alert.severity === 'high'
      ? ['Issue public advisory', 'Increase testing camps', 'Deploy vector control teams']
      : ['Strengthen surveillance', 'Push precaution messaging'];
    return {
      ...alert,
      recommendedActions,
      riskScore: context?.riskScore ?? null,
    };
  });
}

function rankCities(regionScores) {
  return regionScores.map((row, idx) => ({
    rank: idx + 1,
    region: row.region,
    riskLevel: row.riskLevel,
    riskScore: row.riskScore,
  }));
}

function buildDecisionMode(regionScores, earlyWarnings) {
  const top = regionScores.slice(0, 3);
  const actions = top.map((row) => ({
    region: row.region,
    policy: row.humidity >= 70 ? 'Increase mosquito control + larvicide drives' : 'Increase respiratory screening and mask advisories',
    urgency: row.riskLevel,
  }));

  if (earlyWarnings.length) {
    actions.unshift({
      region: earlyWarnings[0].region,
      policy: `Pre-risk advisory: prepare for possible ${earlyWarnings[0].disease.toLowerCase()} rise within 7 days`,
      urgency: 'high',
    });
  }

  return actions;
}

function buildResourceAllocation(regionScores) {
  return regionScores.slice(0, 5).map((row) => ({
    region: row.region,
    doctorsToDeploy: Math.max(3, Math.round(row.riskScore / 12)),
    testKits: Math.max(200, Math.round(row.activeCases * 0.5)),
    bedsToPrepare: Math.max(20, Math.round(row.activeCases * 0.08)),
  }));
}

function buildPatternMemory(regionScores) {
  return regionScores.slice(0, 3).map((row) => ({
    region: row.region,
    similarWave: row.humidity > 70 ? '2021 Dengue Wave Pattern' : '2020 Respiratory Wave Pattern',
    similarityScore: Math.min(94, Math.round(58 + row.riskScore / 2.2)),
  }));
}

function generateInsights({ growthPct, regionScores, predictions, anomalies, earlyWarnings }) {
  const highest = regionScores[0];
  const humid = regionScores.filter((item) => item.humidity !== null).sort((a, b) => b.humidity - a.humidity)[0];

  const insights = [];
  if (growthPct > 0) {
    insights.push({
      type: 'trend',
      confidence: Math.min(95, Math.round(70 + growthPct / 2)),
      message: `Cases are rising (${growthPct}% week-over-week), signaling active transmission pressure.`,
    });
  }

  if (highest) {
    insights.push({
      type: 'risk',
      confidence: Math.min(94, Math.round(65 + highest.riskScore / 3)),
      message: `${highest.region} has the highest dynamic risk score (${highest.riskScore}) with ${highest.activeCases} active cases.`,
    });
  }

  if (humid && humid.humidity > 70) {
    insights.push({
      type: 'environment',
      confidence: 79,
      message: `High humidity in ${humid.region} (${humid.humidity}%) increases malaria/dengue vector survival risk.`,
    });
  }

  const highPrediction = predictions.find((p) => p.level === 'high');
  if (highPrediction) {
    insights.push({
      type: 'prediction',
      confidence: highPrediction.confidence,
      message: `Forecast indicates potential ${highPrediction.disease} spike in ${highPrediction.region} within 7 days.`,
    });
  }

  anomalies.forEach((item) => insights.push({ type: item.type, confidence: 82, message: item.message }));
  earlyWarnings.slice(0, 2).forEach((item) => insights.push({ type: 'early-warning', confidence: item.confidence, message: item.message }));

  return insights;
}

async function buildDashboardPayload({ humidityDelta = 0, casesMultiplier = 1, vaccinationRate = 0 } = {}) {
  const [covid, who, alerts, dataGov] = await Promise.all([
    fetchCovidIndiaData(),
    fetchWhoSignals(),
    fetchIdspAlerts(),
    fetchDataGovRecords(),
  ]);

  const environment = await fetchEnvironmentBatch(covid.regions);
  const growthPct = computeGrowthPercent(covid.timelineCases);
  const alertsByRegion = alerts.reduce((acc, alert) => {
    acc[alert.region] = (acc[alert.region] || 0) + 1;
    return acc;
  }, {});

  const enrichedRegions = covid.regions
    .map((region) => {
      const env = environment.find((item) => item.region === region.region);
      const adjustedEnv = env ? { ...env, humidity: env.humidity !== null ? Number((env.humidity + humidityDelta).toFixed(1)) : null } : null;
      const riskScore = computeRiskScore(region, adjustedEnv, growthPct, alertsByRegion[region.region] || 0);
      const riskLevel = riskLevelFromScore(riskScore);
      return {
        ...region,
        humidity: adjustedEnv?.humidity ?? null,
        temperature: adjustedEnv?.temperature ?? null,
        aqi: adjustedEnv?.aqi ?? null,
        aqiLevel: adjustedEnv?.aqiLevel ?? 'unknown',
        riskScore,
        riskLevel,
      };
    })
    .sort((a, b) => b.riskScore - a.riskScore);

  const diseaseDistribution = deriveDiseaseDistribution(covid.totals, dataGov.records, alerts);
  const predictions = buildPredictions(enrichedRegions, growthPct, { casesMultiplier, vaccinationRate });
  const anomalies = detectAnomalies(covid.timelineCases);
  const earlyWarnings = generateEarlyWarnings(enrichedRegions, growthPct);
  const smartAlerts = enrichSmartAlerts(alerts, enrichedRegions);
  const cityRiskRanking = rankCities(enrichedRegions);
  const decisionMode = buildDecisionMode(enrichedRegions, earlyWarnings);
  const resourceAllocation = buildResourceAllocation(enrichedRegions);
  const patternMemory = buildPatternMemory(enrichedRegions);
  const insights = generateInsights({ growthPct, regionScores: enrichedRegions, predictions, anomalies, earlyWarnings });
  const ageRisk = buildAgeRiskFromRiskScores(enrichedRegions);

  const totalHighRisk = enrichedRegions.filter((region) => region.riskLevel === 'high').length;
  const alertsToday = alerts.filter((alert) => new Date(alert.timestamp).toDateString() === new Date().toDateString()).length;
  const aiConfidence = predictions.length
    ? Math.round(predictions.reduce((sum, item) => sum + item.confidence, 0) / predictions.length)
    : 72;

  return {
    lastUpdated: new Date().toISOString(),
    sources: ['WHO GHO', 'data.gov.in', 'disease.sh', 'Open-Meteo', 'AQICN', 'IDSP'],
    dashboard: {
      totalCases: covid.totals.totalCases,
      activeCases: covid.totals.activeCases,
      highRiskRegions: totalHighRisk,
      alertsToday,
      recoveryRate: covid.totals.totalCases > 0 ? Number(((covid.totals.recoveries / covid.totals.totalCases) * 100).toFixed(2)) : 0,
      aiConfidence,
      growthPct,
      dataConfidence: Math.max(60, 100 - anomalies.length * 6),
    },
    trends: {
      cases: covid.timelineCases,
      diseaseDistribution,
      ageRisk,
      trendComparison: predictions.slice(0, 5).map((item) => ({
        region: item.region,
        currentActive: enrichedRegions.find((r) => r.region === item.region)?.activeCases || 0,
        predictedActive7d: item.predictedActiveCases7d,
      })),
    },
    regions: enrichedRegions,
    alerts: smartAlerts,
    environment,
    predictions,
    insights,
    earlyWarnings,
    anomalies,
    cityRiskRanking,
    decisionMode,
    resourceAllocation,
    patternMemory,
    who,
    dataGov,
  };
}

module.exports = {
  buildDashboardPayload,
};
