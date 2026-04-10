const HealthRecord = require('../models/HealthRecord');
const { normalizePer100k, getPopulation } = require('./epidemiologyService');

async function compareRegions(regions, periodDays = 7) {
  const now = new Date();
  const periodStart = new Date(now - periodDays * 24 * 60 * 60 * 1000);

  const results = await Promise.all(
    regions.map(async (region) => {
      const query = { 'location.region': String(region), createdAt: { $gte: periodStart } };
      const [total, highRisk, diseases] = await Promise.all([
        HealthRecord.countDocuments(query),
        HealthRecord.countDocuments({ ...query, risk: 'High' }),
        HealthRecord.aggregate([
          { $match: { ...query, 'diagnosis.diseaseName': { $exists: true, $ne: null } } },
          { $group: { _id: '$diagnosis.diseaseName', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 5 },
        ]),
      ]);

      const population = getPopulation(region);
      return {
        region,
        totalCases: total,
        highRiskCases: highRisk,
        casesPerHundredK: normalizePer100k(total, population),
        highRiskPercent: total > 0 ? Number(((highRisk / total) * 100).toFixed(1)) : 0,
        topDiseases: diseases.map((d) => ({ name: d._id, count: d.count })),
        population,
      };
    })
  );

  return { regions: results, periodDays, comparedAt: new Date().toISOString() };
}

async function compareTimePeriods(region, period1, period2) {
  const regionQuery = region && region !== 'all' ? { 'location.region': String(region) } : {};

  const [p1Data, p2Data] = await Promise.all(
    [period1, period2].map(async (period) => {
      const query = {
        ...regionQuery,
        createdAt: { $gte: new Date(period.from), $lte: new Date(period.to) },
      };
      const [total, highRisk, avgProb] = await Promise.all([
        HealthRecord.countDocuments(query),
        HealthRecord.countDocuments({ ...query, risk: 'High' }),
        HealthRecord.aggregate([
          { $match: query },
          { $group: { _id: null, avg: { $avg: '$probability' } } },
        ]),
      ]);
      return {
        from: period.from,
        to: period.to,
        totalCases: total,
        highRiskCases: highRisk,
        avgProbability: Number((avgProb[0]?.avg || 0).toFixed(3)),
      };
    })
  );

  const change = p1Data.totalCases > 0
    ? Number((((p2Data.totalCases - p1Data.totalCases) / p1Data.totalCases) * 100).toFixed(1))
    : p2Data.totalCases > 0 ? 100 : 0;

  return {
    region: region || 'all',
    period1: p1Data,
    period2: p2Data,
    change: {
      totalCasesPercent: change,
      direction: change > 0 ? 'increase' : change < 0 ? 'decrease' : 'stable',
    },
    comparedAt: new Date().toISOString(),
  };
}

module.exports = { compareRegions, compareTimePeriods };
