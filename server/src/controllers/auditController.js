const { getAuditLogs } = require('../services/auditService');

exports.getLogs = async (req, res) => {
  try {
    const { action, userId, resourceType, from, to } = req.query;
    const { page, limit } = req.pagination || { page: 1, limit: 50 };
    const result = await getAuditLogs({ action, userId, resourceType, from, to, page, limit });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch audit logs' });
  }
};
