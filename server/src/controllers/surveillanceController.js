const { buildDashboardPayload, getPipelineSnapshot } = require('../services/surveillanceService');
const HealthRecord = require('../models/HealthRecord');

function parseNumericParam(value, defaultValue) {
  if (value === undefined || value === null || value === '') return defaultValue;
  const num = Number(value);
  if (!Number.isFinite(num)) return NaN;
  return num;
}

async function getDashboard(req, res) {
  try {
    const payload = await buildDashboardPayload();
    return res.status(200).json({
      lastUpdated: payload.lastUpdated,
      dataSources: payload.sources || [],
      ...payload.dashboard,
      insights: payload.insights || [],
      earlyWarnings: payload.earlyWarnings || [],
      anomalies: payload.anomalies || [],
      cityRiskRanking: payload.cityRiskRanking || [],
      decisionMode: payload.decisionMode || [],
      resourceAllocation: payload.resourceAllocation || [],
      patternMemory: payload.patternMemory || [],
      selfLearning: payload.selfLearning || {},
      pipelineStatus: payload.pipelineStatus || [],
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch dashboard data', error: error.message });
  }
}

async function getRegions(req, res) {
  try {
    const payload = await buildDashboardPayload();
    return res.status(200).json({ lastUpdated: payload.lastUpdated, regions: payload.regions || [] });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch regions', error: error.message });
  }
}

async function getAlerts(req, res) {
  try {
    const payload = await buildDashboardPayload();
    return res.status(200).json({ lastUpdated: payload.lastUpdated, alerts: payload.alerts || [] });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch alerts', error: error.message });
  }
}

async function getTrends(req, res) {
  try {
    const payload = await buildDashboardPayload();
    return res.status(200).json({ lastUpdated: payload.lastUpdated, ...(payload.trends || {}) });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch trends', error: error.message });
  }
}

async function getEnvironment(req, res) {
  try {
    const payload = await buildDashboardPayload();
    return res.status(200).json({
      lastUpdated: payload.lastUpdated,
      environment: payload.environment,
      source: ['Open-Meteo', 'AQICN'],
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch environment', error: error.message });
  }
}

async function getPredictions(req, res) {
  try {
    const humidityDelta = parseNumericParam(req.query.humidityDelta, 0);
    const casesMultiplier = parseNumericParam(req.query.casesMultiplier, 1);
    const vaccinationRate = parseNumericParam(req.query.vaccinationRate, 0);

    if (Number.isNaN(humidityDelta) || Number.isNaN(casesMultiplier) || Number.isNaN(vaccinationRate)) {
      return res.status(400).json({ message: 'Invalid query parameters: humidityDelta, casesMultiplier, and vaccinationRate must be valid numbers.' });
    }

    const payload = await buildDashboardPayload({ humidityDelta, casesMultiplier, vaccinationRate });
    const predictions = payload.predictions || [];
    return res.status(200).json({
      lastUpdated: payload.lastUpdated,
      predictions,
      hospitalLoadEstimator: predictions.map((prediction) => ({
        region: prediction.region,
        predictedAdmissions: Math.round(prediction.predictedActiveCases7d * 0.11),
        icuDemand: Math.round(prediction.predictedActiveCases7d * 0.018),
      })),
      simulation: {
        humidityDelta,
        casesMultiplier,
        vaccinationRate,
        summary: `Scenario applied with humidity ${humidityDelta >= 0 ? '+' : ''}${humidityDelta}%, cases x${casesMultiplier.toFixed(2)}, vaccination ${vaccinationRate}%.`,
      },
      earlyWarnings: payload.earlyWarnings || [],
      anomalies: payload.anomalies || [],
      scenarioComparisonHint: 'Use /api/predictions/compare to compare two scenarios side-by-side.',
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch predictions', error: error.message });
  }
}

async function compareScenarios(req, res) {
  try {
    const a = {
      humidityDelta: parseNumericParam(req.query.humidityA, 0),
      casesMultiplier: parseNumericParam(req.query.casesA, 1),
      vaccinationRate: parseNumericParam(req.query.vaxA, 0),
    };
    const b = {
      humidityDelta: parseNumericParam(req.query.humidityB, 10),
      casesMultiplier: parseNumericParam(req.query.casesB, 1.2),
      vaccinationRate: parseNumericParam(req.query.vaxB, 0),
    };

    const allValues = [...Object.values(a), ...Object.values(b)];
    if (allValues.some((v) => Number.isNaN(v))) {
      return res.status(400).json({ message: 'Invalid query parameters: humidityA/B, casesA/B, and vaxA/B must be valid numbers.' });
    }

    const [scenarioA, scenarioB] = await Promise.all([buildDashboardPayload(a), buildDashboardPayload(b)]);
    return res.status(200).json({
      lastUpdated: new Date().toISOString(),
      scenarioA: { config: a, predictions: scenarioA.predictions || [] },
      scenarioB: { config: b, predictions: scenarioB.predictions || [] },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to compare scenarios', error: error.message });
  }
}

async function getPipelineStatus(req, res) {
  try {
    return res.status(200).json({ lastUpdated: new Date().toISOString(), pipelines: getPipelineSnapshot() });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch pipeline status', error: error.message });
  }
}

async function getPersonalRisk(req, res) {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'User identity not found. Please log in again.' });
    }

    const payload = await buildDashboardPayload();
    const regions = payload.regions || [];
    const latest = await HealthRecord.findOne({ userId: req.user.id }).sort({ createdAt: -1 }).lean();

    if (!latest) {
      return res.status(200).json({
        riskLevel: 'Unknown',
        score: 0,
        reason: 'No personal case records yet. Submit symptoms to get personalized risk.',
      });
    }

    const regionName = latest?.location?.region || latest?.location?.city;
    const regionRisk = regions.find((r) => r.region === regionName) || regions[0] || null;
    const age = Number(latest?.personalDetails?.age || 30);
    const ageFactor = age > 60 ? 12 : age > 45 ? 8 : age > 30 ? 5 : 2;
    const envFactor = Math.max(0, (Number(regionRisk?.aqi || 60) - 80) / 8) + Math.max(0, (Number(regionRisk?.humidity || 60) - 70) / 3);
    const baseScore = Number(regionRisk?.riskScore || 35);
    const score = Math.min(100, Number((baseScore + ageFactor + envFactor).toFixed(1)));
    const riskLevel = score >= 70 ? 'High' : score >= 45 ? 'Moderate' : 'Low';

    return res.status(200).json({
      region: regionName,
      score,
      riskLevel,
      category: regionRisk?.humidity > 68 ? 'Vector-borne' : 'Respiratory',
      reason: `Based on local risk score (${baseScore}), age factor (${ageFactor}) and environment stress (${envFactor.toFixed(1)}).`,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch personal risk', error: error.message });
  }
}

async function getRegionDetails(req, res) {
  try {
    const regionParam = req.params.region;
    if (!regionParam || !regionParam.trim()) {
      return res.status(400).json({ message: 'Region parameter is required.' });
    }
    if (regionParam.length > 100) {
      return res.status(400).json({ message: 'Region parameter is too long.' });
    }

    const regionKey = regionParam.trim().toLowerCase();
    const payload = await buildDashboardPayload();
    const regions = payload.regions || [];
    const region = regions.find((r) => r.region.toLowerCase() === regionKey || r.city.toLowerCase() === regionKey);
    if (!region) return res.status(404).json({ message: `Region '${regionParam.trim()}' not found.` });

    const regionLower = region.region.toLowerCase();
    return res.status(200).json({
      lastUpdated: payload.lastUpdated,
      region,
      alerts: (payload.alerts || []).filter((a) => a.region.toLowerCase() === regionLower),
      predictions: (payload.predictions || []).filter((p) => p.region.toLowerCase() === regionLower),
      decisionMode: (payload.decisionMode || []).filter((d) => d.region.toLowerCase() === regionLower),
      patternMemory: (payload.patternMemory || []).filter((p) => p.region.toLowerCase() === regionLower),
      causes: [
        `Humidity contribution: ${region.humidity ?? 'N/A'}%`,
        `AQI contribution: ${region.aqi ?? 'N/A'}`,
        `Active cases: ${region.activeCases}`,
      ],
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch region details', error: error.message });
  }
}

async function getIntelligence(req, res) {
  try {
    const payload = await buildDashboardPayload();
    return res.status(200).json({
      lastUpdated: payload.lastUpdated,
      earlyWarnings: payload.earlyWarnings || [],
      anomalies: payload.anomalies || [],
      cityRiskRanking: payload.cityRiskRanking || [],
      decisionMode: payload.decisionMode || [],
      resourceAllocation: payload.resourceAllocation || [],
      patternMemory: payload.patternMemory || [],
      insights: payload.insights || [],
      selfLearning: payload.selfLearning || {},
      pipelineStatus: payload.pipelineStatus || [],
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch intelligence', error: error.message });
  }
}

async function getDataset(req, res) {
  try {
    const payload = await buildDashboardPayload();
    return res.status(200).json(payload);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch complete dataset', error: error.message });
  }
}

module.exports = {
  getDashboard,
  getRegions,
  getAlerts,
  getTrends,
  getEnvironment,
  getPredictions,
  compareScenarios,
  getPipelineStatus,
  getPersonalRisk,
  getRegionDetails,
  getDataset,
  getIntelligence,
};
