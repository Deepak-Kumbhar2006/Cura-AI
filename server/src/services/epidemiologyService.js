const HealthRecord = require('../models/HealthRecord');

const POPULATION_DATA = {
  'pune': 7400000,
  'mumbai': 21000000,
  'delhi': 19000000,
  'bangalore': 12800000,
  'chennai': 11500000,
  'hyderabad': 10500000,
  'kolkata': 15000000,
  'ahmedabad': 8400000,
  'jaipur': 4100000,
  'lucknow': 3700000,
  'metro north': 5000000,
  'south zone': 8000000,
  'west zone': 6000000,
  'east zone': 4500000,
  'central zone': 3500000,
  'north zone': 7000000,
  'default': 1000000,
};

function getPopulation(region) {
  const key = (region || '').toLowerCase();
  return POPULATION_DATA[key] || POPULATION_DATA['default'];
}

function incidenceRate(newCases, population, period = 7) {
  if (!population || population === 0) return 0;
  return Number(((newCases / population) * 100000 * (7 / period)).toFixed(2));
}

function prevalenceRate(activeCases, population) {
  if (!population || population === 0) return 0;
  return Number(((activeCases / population) * 100000).toFixed(2));
}

function caseFatalityRate(deaths, totalCases) {
  if (!totalCases || totalCases === 0) return 0;
  return Number(((deaths / totalCases) * 100).toFixed(2));
}

function growthRate(currentPeriod, previousPeriod) {
  if (!previousPeriod || previousPeriod === 0) return currentPeriod > 0 ? 100 : 0;
  return Number((((currentPeriod - previousPeriod) / previousPeriod) * 100).toFixed(2));
}

function normalizePer100k(count, population) {
  if (!population || population === 0) return 0;
  return Number(((count / population) * 100000).toFixed(2));
}

async function computeRegionMetrics(region, periodDays = 7) {
  const now = new Date();
  const periodStart = new Date(now - periodDays * 24 * 60 * 60 * 1000);
  const prevPeriodStart = new Date(periodStart - periodDays * 24 * 60 * 60 * 1000);

  const regionQuery = region && region !== 'all' ? { 'location.region': String(region) } : {};

  const [currentCases, previousCases, totalCases, highRiskCases] = await Promise.all([
    HealthRecord.countDocuments({ ...regionQuery, createdAt: { $gte: periodStart } }),
    HealthRecord.countDocuments({ ...regionQuery, createdAt: { $gte: prevPeriodStart, $lt: periodStart } }),
    HealthRecord.countDocuments(regionQuery),
    HealthRecord.countDocuments({ ...regionQuery, risk: 'High' }),
  ]);

  const population = getPopulation(region);
  const confirmedCases = await HealthRecord.countDocuments({ ...regionQuery, 'diagnosis.status': 'Confirmed' });
  const recoveredCases = await HealthRecord.countDocuments({ ...regionQuery, 'diagnosis.status': 'Recovered' });

  return {
    region: region || 'all',
    population,
    periodDays,
    totalCases,
    currentPeriodCases: currentCases,
    previousPeriodCases: previousCases,
    incidenceRate: incidenceRate(currentCases, population, periodDays),
    prevalenceRate: prevalenceRate(totalCases - recoveredCases, population),
    caseFatalityRate: caseFatalityRate(0, confirmedCases),
    growthRate: growthRate(currentCases, previousCases),
    casesPerHundredK: normalizePer100k(totalCases, population),
    highRiskCount: highRiskCases,
    confirmedCases,
    recoveredCases,
  };
}

async function computeAggregatedMetrics(groupBy = 'region', periodDays = 7) {
  const now = new Date();
  const periodStart = new Date(now - periodDays * 24 * 60 * 60 * 1000);

  let groupField;
  if (groupBy === 'disease') groupField = '$diagnosis.diseaseName';
  else if (groupBy === 'city') groupField = '$location.city';
  else groupField = '$location.region';

  const pipeline = [
    { $match: { createdAt: { $gte: periodStart } } },
    {
      $group: {
        _id: groupField,
        totalCases: { $sum: 1 },
        highRisk: { $sum: { $cond: [{ $eq: ['$risk', 'High'] }, 1, 0] } },
        avgProbability: { $avg: '$probability' },
      },
    },
    { $sort: { totalCases: -1 } },
  ];

  const results = await HealthRecord.aggregate(pipeline);
  return results.map((r) => ({
    name: r._id || 'Unknown',
    totalCases: r.totalCases,
    highRisk: r.highRisk,
    avgProbability: Number((r.avgProbability || 0).toFixed(3)),
    casesPerHundredK: normalizePer100k(r.totalCases, getPopulation(r._id)),
  }));
}

module.exports = {
  getPopulation,
  incidenceRate,
  prevalenceRate,
  caseFatalityRate,
  growthRate,
  normalizePer100k,
  computeRegionMetrics,
  computeAggregatedMetrics,
  POPULATION_DATA,
};
