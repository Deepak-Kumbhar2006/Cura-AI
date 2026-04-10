const AlertThreshold = require('../models/AlertThreshold');
const { logAction } = require('../services/auditService');

exports.createThreshold = async (req, res) => {
  try {
    const { name, region, disease, metric, operator, value } = req.body;
    if (!name || !metric || !operator || value == null) {
      return res.status(400).json({ message: 'name, metric, operator, and value are required' });
    }
    const validMetrics = ['case_count', 'growth_rate', 'incidence_rate', 'cfr'];
    const validOps = ['gt', 'gte', 'lt', 'lte', 'eq'];
    if (!validMetrics.includes(metric)) return res.status(400).json({ message: `metric must be one of: ${validMetrics.join(', ')}` });
    if (!validOps.includes(operator)) return res.status(400).json({ message: `operator must be one of: ${validOps.join(', ')}` });

    const threshold = await AlertThreshold.create({
      name,
      region: region || 'all',
      disease: disease || 'all',
      metric,
      operator,
      value: Number(value),
      createdBy: req.user.id,
    });

    await logAction({
      action: 'threshold_change',
      userId: req.user.id,
      resourceType: 'AlertThreshold',
      resourceId: threshold._id,
      details: { name, metric, operator, value },
    });

    return res.status(201).json(threshold);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create threshold' });
  }
};

exports.getThresholds = async (req, res) => {
  try {
    const query = {};
    if (req.query.region) query.region = String(req.query.region);
    if (req.query.disease) query.disease = String(req.query.disease);
    if (req.query.enabled != null) query.enabled = req.query.enabled === 'true';
    const thresholds = await AlertThreshold.find(query).sort({ createdAt: -1 }).lean();
    return res.status(200).json(thresholds);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch thresholds' });
  }
};

exports.updateThreshold = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = {};
    if (req.body.name != null) updates.name = req.body.name;
    if (req.body.value != null) updates.value = Number(req.body.value);
    if (req.body.operator != null) updates.operator = req.body.operator;
    if (req.body.enabled != null) updates.enabled = req.body.enabled;

    const threshold = await AlertThreshold.findByIdAndUpdate(id, { $set: updates }, { new: true, runValidators: true });
    if (!threshold) return res.status(404).json({ message: 'Threshold not found' });

    await logAction({
      action: 'threshold_change',
      userId: req.user.id,
      resourceType: 'AlertThreshold',
      resourceId: threshold._id,
      details: updates,
    });

    return res.status(200).json(threshold);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update threshold' });
  }
};

exports.deleteThreshold = async (req, res) => {
  try {
    const threshold = await AlertThreshold.findByIdAndDelete(req.params.id);
    if (!threshold) return res.status(404).json({ message: 'Threshold not found' });

    await logAction({
      action: 'threshold_change',
      userId: req.user.id,
      resourceType: 'AlertThreshold',
      resourceId: threshold._id,
      details: { deleted: true },
    });

    return res.status(200).json({ message: 'Threshold deleted' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete threshold' });
  }
};
