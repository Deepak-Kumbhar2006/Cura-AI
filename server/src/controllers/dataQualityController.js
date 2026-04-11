const DataQualityLog = require('../models/DataQualityLog');

exports.getQualityLogs = async (req, res) => {
  try {
    const { page, limit } = req.pagination || { page: 1, limit: 50 };
    const query = {};
    if (req.query.minScore) query.qualityScore = { $gte: Number(req.query.minScore) };
    if (req.query.maxScore) {
      query.qualityScore = query.qualityScore || {};
      query.qualityScore.$lte = Number(req.query.maxScore);
    }
    if (req.query.validationPassed != null) query.validationPassed = req.query.validationPassed === 'true';

    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      DataQualityLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      DataQualityLog.countDocuments(query),
    ]);

    return res.status(200).json({
      logs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch quality logs' });
  }
};

exports.getQualityStats = async (_req, res) => {
  try {
    const [avgScore, totalLogs, failedCount, flagCounts] = await Promise.all([
      DataQualityLog.aggregate([{ $group: { _id: null, avg: { $avg: '$qualityScore' } } }]),
      DataQualityLog.countDocuments(),
      DataQualityLog.countDocuments({ validationPassed: false }),
      DataQualityLog.aggregate([
        { $unwind: '$flags' },
        { $group: { _id: '$flags.type', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    return res.status(200).json({
      averageQualityScore: Number((avgScore[0]?.avg || 0).toFixed(1)),
      totalAssessments: totalLogs,
      failedValidations: failedCount,
      flagBreakdown: flagCounts.map((f) => ({ type: f._id, count: f.count })),
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch quality stats' });
  }
};
