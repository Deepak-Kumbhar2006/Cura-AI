const { computeRegionMetrics, computeAggregatedMetrics } = require('../services/epidemiologyService');
const { detectTrendInsights, detectDiseasePatterns } = require('../services/ruleInsightsService');
const { compareRegions, compareTimePeriods } = require('../services/comparativeAnalysisService');
const { logAction } = require('../services/auditService');
const HealthRecord = require('../models/HealthRecord');

// Feature 7 & 8: Epidemiological metrics + normalization
exports.getEpidemiologyMetrics = async (req, res) => {
  try {
    const { region, period } = req.query;
    const periodDays = Number(period) || 7;
    const metrics = await computeRegionMetrics(region || 'all', periodDays);
    return res.status(200).json(metrics);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to compute metrics' });
  }
};

// Feature 12: Aggregation pipelines
exports.getAggregatedData = async (req, res) => {
  try {
    const { groupBy, period } = req.query;
    const periodDays = Number(period) || 7;
    const validGroups = ['region', 'disease', 'city'];
    const group = validGroups.includes(groupBy) ? groupBy : 'region';
    const data = await computeAggregatedMetrics(group, periodDays);
    return res.status(200).json({ groupBy: group, periodDays, data });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to aggregate data' });
  }
};

// Feature 17: Rule-based insights
exports.getRuleInsights = async (req, res) => {
  try {
    const { region, days } = req.query;
    const d = Number(days) || 7;
    const [trends, patterns] = await Promise.all([
      detectTrendInsights(region, d),
      detectDiseasePatterns(region, d),
    ]);
    return res.status(200).json({ insights: [...trends, ...patterns], region: region || 'all', periodDays: d });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to generate insights' });
  }
};

// Feature 15: Comparative analysis — regions
exports.compareRegions = async (req, res) => {
  try {
    const { regions, period } = req.query;
    if (!regions) return res.status(400).json({ message: 'regions query param required (comma-separated)' });
    const regionList = String(regions).split(',').map((r) => r.trim()).filter(Boolean);
    if (regionList.length < 2) return res.status(400).json({ message: 'At least 2 regions required for comparison' });
    const periodDays = Number(period) || 7;
    const result = await compareRegions(regionList, periodDays);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to compare regions' });
  }
};

// Feature 15: Comparative analysis — time periods
exports.compareTimePeriods = async (req, res) => {
  try {
    const { region, from1, to1, from2, to2 } = req.query;
    if (!from1 || !to1 || !from2 || !to2) {
      return res.status(400).json({ message: 'from1, to1, from2, to2 query params required (ISO dates)' });
    }
    const result = await compareTimePeriods(region, { from: from1, to: to1 }, { from: from2, to: to2 });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to compare time periods' });
  }
};

// Feature 6: Advanced filtering & query engine
exports.advancedQuery = async (req, res) => {
  try {
    const { region, disease, risk, dateFrom, dateTo, severity, city, sortBy, order } = req.query;
    const { page, limit } = req.pagination || { page: 1, limit: 50 };

    const query = {};
    if (region) query['location.region'] = String(region);
    if (city) query['location.city'] = String(city);
    if (disease) query['diagnosis.diseaseName'] = String(disease);
    if (risk) query.risk = String(risk);
    if (severity) query['diagnosis.severity'] = String(severity);
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    const sortField = sortBy || 'createdAt';
    const sortOrder = order === 'asc' ? 1 : -1;
    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      HealthRecord.find(query).sort({ [sortField]: sortOrder }).skip(skip).limit(limit).lean(),
      HealthRecord.countDocuments(query),
    ]);

    await logAction({ action: 'processing', userId: req.user?.id, resourceType: 'HealthRecord', details: { query, page, limit } });

    return res.status(200).json({
      records,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      filters: { region, disease, risk, severity, city, dateFrom, dateTo },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to query records' });
  }
};

// Feature 11: Dashboard performance — paginated records
exports.getPaginatedRecords = async (req, res) => {
  try {
    const { page, limit } = req.pagination || { page: 1, limit: 50 };
    const baseQuery = req.user.role === 'patient' ? { userId: req.user.id } : {};
    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      HealthRecord.find(baseQuery).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      HealthRecord.countDocuments(baseQuery),
    ]);

    return res.status(200).json({
      records,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch paginated records' });
  }
};
