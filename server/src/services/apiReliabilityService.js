const ApiSourceStatus = require('../models/ApiSourceStatus');
const axios = require('axios');

async function trackApiCall(sourceName, url, callFn) {
  const start = Date.now();
  let status = await ApiSourceStatus.findOne({ name: sourceName });
  if (!status) {
    status = await ApiSourceStatus.create({ name: sourceName, url });
  }

  try {
    const result = await callFn();
    const elapsed = Date.now() - start;
    const totalCalls = status.successCount + status.failureCount + 1;
    const newAvg = Math.round((status.avgResponseMs * (totalCalls - 1) + elapsed) / totalCalls);
    const uptime = Number((((status.successCount + 1) / totalCalls) * 100).toFixed(1));

    await ApiSourceStatus.updateOne(
      { name: sourceName },
      {
        $set: {
          lastSuccess: new Date(),
          lastResponseMs: elapsed,
          avgResponseMs: newAvg,
          uptime,
          status: elapsed > 10000 ? 'degraded' : 'healthy',
          lastDataTimestamp: new Date(),
          dataLatencyHours: 0,
        },
        $inc: { successCount: 1 },
      }
    );
    return result;
  } catch (error) {
    const elapsed = Date.now() - start;
    const totalCalls = status.successCount + status.failureCount + 1;
    const uptime = Number(((status.successCount / totalCalls) * 100).toFixed(1));

    await ApiSourceStatus.updateOne(
      { name: sourceName },
      {
        $set: {
          lastFailure: new Date(),
          lastResponseMs: elapsed,
          uptime,
          status: uptime < 50 ? 'down' : 'degraded',
        },
        $inc: { failureCount: 1 },
      }
    );
    throw error;
  }
}

async function callWithFallback(primaryName, primaryFn, fallbackName, fallbackFn) {
  try {
    return await trackApiCall(primaryName, '', primaryFn);
  } catch (_err) {
    if (fallbackFn) {
      return trackApiCall(fallbackName || `${primaryName}-fallback`, '', fallbackFn);
    }
    throw _err;
  }
}

async function getAllSourceStatuses() {
  return ApiSourceStatus.find().sort({ name: 1 }).lean();
}

async function getSourceFreshness() {
  const sources = await getAllSourceStatuses();
  return sources.map((s) => {
    const hoursAgo = s.lastDataTimestamp
      ? Math.round((Date.now() - new Date(s.lastDataTimestamp).getTime()) / (1000 * 60 * 60))
      : null;
    return {
      name: s.name,
      status: s.status,
      lastUpdated: s.lastDataTimestamp,
      dataAgeHours: hoursAgo,
      latencyLabel: hoursAgo === null ? 'No data' : hoursAgo <= 1 ? 'Fresh' : hoursAgo <= 24 ? `${hoursAgo}h old` : `${Math.round(hoursAgo / 24)}d old — High latency source`,
      uptime: s.uptime,
      avgResponseMs: s.avgResponseMs,
    };
  });
}

module.exports = { trackApiCall, callWithFallback, getAllSourceStatuses, getSourceFreshness };
