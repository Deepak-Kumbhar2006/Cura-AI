const HealthRecord = require('../models/HealthRecord');
const Alert = require('../models/Alert');

exports.getStats = async (_req, res) => {
  try {
    const [totalCases, activeAlerts, highRiskZones, trends, regionStats] = await Promise.all([
      HealthRecord.countDocuments(),
      Alert.countDocuments({ active: true }),
      HealthRecord.distinct('location.region', { 'prediction.risk': 'High' }),
      HealthRecord.aggregate([
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$recordedAt' },
            },
            cases: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      HealthRecord.aggregate([
        {
          $group: {
            _id: '$location.region',
            cases: { $sum: 1 },
            highRisk: {
              $sum: {
                $cond: [{ $eq: ['$prediction.risk', 'High'] }, 1, 0],
              },
            },
          },
        },
      ]),
    ]);

    res.status(200).json({
      totalCases,
      activeAlerts,
      highRiskZones: highRiskZones.length,
      trends,
      regionStats,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch dashboard stats', error: error.message });
  }
};

exports.getAlerts = async (_req, res) => {
  try {
    const alerts = await Alert.find().sort({ createdAt: -1 }).limit(20);
    res.status(200).json(alerts);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch alerts', error: error.message });
  }
};
