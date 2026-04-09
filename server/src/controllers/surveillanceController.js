const { buildDashboardPayload } = require('../services/surveillanceService');

async function getDashboard(req, res) {
  try {
    const payload = await buildDashboardPayload();
    return res.status(200).json({
      lastUpdated: payload.lastUpdated,
      dataSources: payload.sources,
      ...payload.dashboard,
      insights: payload.insights,
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
    const payload = await buildDashboardPayload({ humidityDelta });
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
        summary: humidityDelta
          ? `Scenario applied with humidity adjustment of ${humidityDelta}% for all monitored regions.`
          : 'Baseline prediction scenario with current humidity signals.',
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch predictions', error: error.message });
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
  getDataset,
};
