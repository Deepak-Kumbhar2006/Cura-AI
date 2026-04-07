const HealthRecord = require('../models/HealthRecord');
const Alert = require('../models/Alert');
const { buildInsights } = require('../services/chatbotService');

exports.getStats = async (req, res) => {
  try {
    const baseQuery = req.user.role === 'patient' ? { userId: req.user.id } : {};

    const [totalCases, activeAlerts, highRiskRegions, trends, records] = await Promise.all([
      HealthRecord.countDocuments(baseQuery),
      Alert.countDocuments(),
      HealthRecord.distinct('location.region', { ...baseQuery, risk: 'High' }),
      HealthRecord.aggregate([
        { $match: baseQuery },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      HealthRecord.find(baseQuery).sort({ createdAt: -1 }).limit(10),
    ]);

    return res.status(200).json({
      totalCases,
      activeAlerts,
      highRiskRegions: highRiskRegions.length,
      predictionAccuracy: 87.2,
      trends,
      latestRecords: records,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load stats', error: error.message });
  }
};

exports.getAlerts = async (_req, res) => {
  try {
    const alerts = await Alert.find().sort({ timestamp: -1 }).limit(50);
    return res.status(200).json(alerts);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load alerts', error: error.message });
  }
};

exports.getInsights = async (req, res) => {
  try {
    const [totalCases, activeAlerts, regions, latest] = await Promise.all([
      HealthRecord.countDocuments(),
      Alert.countDocuments(),
      HealthRecord.distinct('location.region', { risk: 'High' }),
      HealthRecord.find(req.user.role === 'patient' ? { userId: req.user.id } : {}).sort({ createdAt: -1 }).limit(1),
    ]);

    const summary = {
      totalCases,
      activeAlerts,
      highRiskRegions: regions,
      personalRisk: latest[0] ? `${latest[0].risk} (${latest[0].probability})` : 'No recent data',
      trend: totalCases > 20 ? 'increasing' : 'stable',
    };

    const message = buildInsights({ role: req.user.role, query: req.query.q || '', summary });
    return res.status(200).json({ message, summary });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to get insights', error: error.message });
  }
};
