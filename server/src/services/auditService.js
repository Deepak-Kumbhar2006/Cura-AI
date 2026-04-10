const AuditLog = require('../models/AuditLog');

async function logAction({ action, userId, resourceType, resourceId, details, ip, userAgent, status }) {
  try {
    return await AuditLog.create({
      action,
      userId: userId || undefined,
      resourceType: resourceType || '',
      resourceId: resourceId || undefined,
      details: details || {},
      ip: ip || '',
      userAgent: userAgent || '',
      status: status || 'success',
    });
  } catch (_err) {
    // Audit logging should never crash the main flow
    return null;
  }
}

function auditMiddleware(action, resourceType) {
  return (req, _res, next) => {
    req._auditAction = action;
    req._auditResourceType = resourceType;
    next();
  };
}

async function getAuditLogs({ action, userId, resourceType, from, to, page = 1, limit = 50 }) {
  const query = {};
  if (action) query.action = String(action);
  if (userId) query.userId = userId;
  if (resourceType) query.resourceType = String(resourceType);
  if (from || to) {
    query.createdAt = {};
    if (from) query.createdAt.$gte = new Date(from);
    if (to) query.createdAt.$lte = new Date(to);
  }

  const skip = (page - 1) * limit;
  const [logs, total] = await Promise.all([
    AuditLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    AuditLog.countDocuments(query),
  ]);

  return { logs, total, page, limit, totalPages: Math.ceil(total / limit) };
}

module.exports = { logAction, auditMiddleware, getAuditLogs };
