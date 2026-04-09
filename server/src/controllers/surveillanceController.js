const { buildDashboardPayload, getPipelineSnapshot } = require('../services/surveillanceService');
const HealthRecord = require('../models/HealthRecord');

async function getDashboard(req, res) {
  try {
    const payload = await buildDashboardPayload();
    return res.status(200).json({
      lastUpdated: payload.lastUpdated,
      dataSources: payload.sources,
      ...payload.dashboard,
      insights: payload.insights,
      earlyWarnings: payload.earlyWarnings,
      anomalies: payload.anomalies,
      cityRiskRanking: payload.cityRiskRanking,
      decisionMode: payload.decisionMode,
      resourceAllocation: payload.resourceAllocation,
      patternMemory: payload.patternMemory,
      selfLearning: payload.selfLearning,
      pipelineStatus: payload.pipelineStatus,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch dashboard data', error: error.message });
  }
}

async function getRegions(req, res) {
  try {
    const payload = await buildDashboardPayload();
    return res.status(200).json({ lastUpdated: payload.lastUpdated, regions: payload.regions });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch regions', error: error.message });
  }
}

async function getAlerts(req, res) {
  try {
    const payload = await buildDashboardPayload();
    return res.status(200).json({ lastUpdated: payload.lastUpdated, alerts: payload.alerts });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch alerts', error: error.message });
  }
}

async function getTrends(req, res) {
  try {
    const payload = await buildDashboardPayload();
    return res.status(200).json({ lastUpdated: payload.lastUpdated, ...payload.trends });
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
    const humidityDelta = Number(req.query.humidityDelta || 0);
    const casesMultiplier = Number(req.query.casesMultiplier || 1);
    const vaccinationRate = Number(req.query.vaccinationRate || 0);
    const payload = await buildDashboardPayload({ humidityDelta, casesMultiplier, vaccinationRate });
    return res.status(200).json({
      lastUpdated: payload.lastUpdated,
      predictions: payload.predictions,
      hospitalLoadEstimator: payload.predictions.map((prediction) => ({
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
      earlyWarnings: payload.earlyWarnings,
      anomalies: payload.anomalies,
      scenarioComparisonHint: 'Use /api/predictions/compare to compare two scenarios side-by-side.',
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch predictions', error: error.message });
  }
}

async function compareScenarios(req, res) {
  try {
    const a = {
      humidityDelta: Number(req.query.humidityA || 0),
      casesMultiplier: Number(req.query.casesA || 1),
      vaccinationRate: Number(req.query.vaxA || 0),
    };
    const b = {
      humidityDelta: Number(req.query.humidityB || 10),
      casesMultiplier: Number(req.query.casesB || 1.2),
      vaccinationRate: Number(req.query.vaxB || 0),
    };

    const [scenarioA, scenarioB] = await Promise.all([buildDashboardPayload(a), buildDashboardPayload(b)]);
    return res.status(200).json({
      lastUpdated: new Date().toISOString(),
      scenarioA: { config: a, predictions: scenarioA.predictions },
      scenarioB: { config: b, predictions: scenarioB.predictions },
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
    const payload = await buildDashboardPayload();
    const latest = await HealthRecord.findOne({ userId: req.user.id }).sort({ createdAt: -1 }).lean();

    if (!latest) {
      return res.status(200).json({
        riskLevel: 'Unknown',
        score: 0,
        reason: 'No personal case records yet. Submit symptoms to get personalized risk.',
      });
    }

    const regionName = latest?.location?.region || latest?.location?.city;
    const regionRisk = payload.regions.find((r) => r.region === regionName) || payload.regions[0];
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
    const regionKey = String(req.params.region || '').toLowerCase();
    const payload = await buildDashboardPayload();
    const region = payload.regions.find((r) => r.region.toLowerCase() === regionKey || r.city.toLowerCase() === regionKey);
    if (!region) return res.status(404).json({ message: 'Region not found' });

    return res.status(200).json({
      lastUpdated: payload.lastUpdated,
      region,
      alerts: payload.alerts.filter((a) => a.region.toLowerCase() === region.region.toLowerCase()),
      predictions: payload.predictions.filter((p) => p.region.toLowerCase() === region.region.toLowerCase()),
      decisionMode: payload.decisionMode.filter((d) => d.region.toLowerCase() === region.region.toLowerCase()),
      patternMemory: payload.patternMemory.filter((p) => p.region.toLowerCase() === region.region.toLowerCase()),
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
      earlyWarnings: payload.earlyWarnings,
      anomalies: payload.anomalies,
      cityRiskRanking: payload.cityRiskRanking,
      decisionMode: payload.decisionMode,
      resourceAllocation: payload.resourceAllocation,
      patternMemory: payload.patternMemory,
      insights: payload.insights,
      selfLearning: payload.selfLearning,
      pipelineStatus: payload.pipelineStatus,
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
