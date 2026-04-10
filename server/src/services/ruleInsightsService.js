const HealthRecord = require('../models/HealthRecord');

async function detectTrendInsights(region, days = 7) {
  const insights = [];
  const now = new Date();

  const dailyCounts = await HealthRecord.aggregate([
    {
      $match: {
        ...(region && region !== 'all' ? { 'location.region': String(region) } : {}),
        createdAt: { $gte: new Date(now - days * 24 * 60 * 60 * 1000) },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
        highRisk: { $sum: { $cond: [{ $eq: ['$risk', 'High'] }, 1, 0] } },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  if (dailyCounts.length >= 3) {
    const last3 = dailyCounts.slice(-3);
    const increasing = last3.every((d, i) => i === 0 || d.count > last3[i - 1].count);
    const decreasing = last3.every((d, i) => i === 0 || d.count < last3[i - 1].count);

    if (increasing) {
      insights.push({
        type: 'trend',
        severity: 'warning',
        message: `Sustained increase for ${last3.length} consecutive days — upward trend detected`,
        data: { days: last3.length, counts: last3.map((d) => d.count) },
      });
    } else if (decreasing) {
      insights.push({
        type: 'trend',
        severity: 'info',
        message: `Cases declining for ${last3.length} consecutive days — downward trend`,
        data: { days: last3.length, counts: last3.map((d) => d.count) },
      });
    }
  }

  if (dailyCounts.length >= 2) {
    const latest = dailyCounts[dailyCounts.length - 1];
    const previous = dailyCounts[dailyCounts.length - 2];
    if (previous.count > 0 && latest.count / previous.count >= 2) {
      insights.push({
        type: 'spike',
        severity: 'critical',
        message: `Sudden spike: cases doubled from ${previous.count} to ${latest.count} — possible outbreak`,
        data: { previousCount: previous.count, currentCount: latest.count, ratio: Number((latest.count / previous.count).toFixed(1)) },
      });
    }
  }

  if (dailyCounts.length >= 5) {
    const counts = dailyCounts.map((d) => d.count);
    const avg = counts.reduce((a, b) => a + b, 0) / counts.length;
    const std = Math.sqrt(counts.reduce((sum, c) => sum + Math.pow(c - avg, 2), 0) / counts.length);
    const latest = counts[counts.length - 1];
    if (std > 0 && (latest - avg) / std > 2) {
      insights.push({
        type: 'anomaly',
        severity: 'warning',
        message: `Anomalous spike detected: ${latest} cases vs ${Math.round(avg)} average (z-score > 2)`,
        data: { current: latest, average: Math.round(avg), stdDev: Math.round(std) },
      });
    }
  }

  const highRiskTotal = dailyCounts.reduce((sum, d) => sum + d.highRisk, 0);
  const totalCases = dailyCounts.reduce((sum, d) => sum + d.count, 0);
  if (totalCases > 0 && highRiskTotal / totalCases > 0.3) {
    insights.push({
      type: 'risk_concentration',
      severity: 'warning',
      message: `High risk concentration: ${Math.round((highRiskTotal / totalCases) * 100)}% of cases are high-risk`,
      data: { highRiskPercent: Math.round((highRiskTotal / totalCases) * 100) },
    });
  }

  if (dailyCounts.length === 0) {
    insights.push({
      type: 'no_data',
      severity: 'info',
      message: `No case data reported in the last ${days} days`,
      data: {},
    });
  }

  return insights;
}

async function detectDiseasePatterns(region, days = 14) {
  const now = new Date();
  const regionQuery = region && region !== 'all' ? { 'location.region': String(region) } : {};

  const diseaseGroups = await HealthRecord.aggregate([
    {
      $match: {
        ...regionQuery,
        createdAt: { $gte: new Date(now - days * 24 * 60 * 60 * 1000) },
        'diagnosis.diseaseName': { $exists: true, $ne: null },
      },
    },
    {
      $group: {
        _id: '$diagnosis.diseaseName',
        count: { $sum: 1 },
        avgProbability: { $avg: '$probability' },
        highRisk: { $sum: { $cond: [{ $eq: ['$risk', 'High'] }, 1, 0] } },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 10 },
  ]);

  const insights = [];
  if (diseaseGroups.length > 0) {
    const top = diseaseGroups[0];
    insights.push({
      type: 'dominant_disease',
      severity: 'info',
      message: `${top._id} is the most reported disease with ${top.count} cases (avg risk probability: ${(top.avgProbability || 0).toFixed(2)})`,
      data: { disease: top._id, count: top.count, avgProbability: Number((top.avgProbability || 0).toFixed(3)) },
    });
  }

  return insights;
}

module.exports = { detectTrendInsights, detectDiseasePatterns };
