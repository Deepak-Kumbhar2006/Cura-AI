const DataSnapshot = require('../models/DataSnapshot');
const { logAction } = require('../services/auditService');

exports.createSnapshot = async (req, res) => {
  try {
    const { source, region, disease, data, revisionNote } = req.body;
    if (!source || !region) return res.status(400).json({ message: 'source and region are required' });

    const existing = await DataSnapshot.findOne({ source, region, disease: disease || 'all' })
      .sort({ snapshotDate: -1 })
      .lean();

    const revision = existing ? existing.revision + 1 : 1;
    const previousValues = existing ? existing.data : null;

    const snapshot = await DataSnapshot.create({
      source,
      region,
      disease: disease || 'all',
      snapshotDate: new Date(),
      data: data || {},
      revision,
      previousValues,
      revisionNote: revisionNote || '',
    });

    await logAction({
      action: 'data_ingestion',
      userId: req.user?.id,
      resourceType: 'DataSnapshot',
      resourceId: snapshot._id,
      details: { source, region, revision },
    });

    return res.status(201).json(snapshot);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create snapshot' });
  }
};

exports.getSnapshots = async (req, res) => {
  try {
    const { source, region, disease, from, to } = req.query;
    const { page, limit } = req.pagination || { page: 1, limit: 50 };
    const query = {};
    if (source) query.source = String(source);
    if (region) query.region = String(region);
    if (disease) query.disease = String(disease);
    if (from || to) {
      query.snapshotDate = {};
      if (from) query.snapshotDate.$gte = new Date(from);
      if (to) query.snapshotDate.$lte = new Date(to);
    }

    const skip = (page - 1) * limit;
    const [snapshots, total] = await Promise.all([
      DataSnapshot.find(query).sort({ snapshotDate: -1 }).skip(skip).limit(limit).lean(),
      DataSnapshot.countDocuments(query),
    ]);

    return res.status(200).json({
      snapshots,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch snapshots' });
  }
};

exports.compareSnapshots = async (req, res) => {
  try {
    const { id1, id2 } = req.query;
    if (!id1 || !id2) return res.status(400).json({ message: 'id1 and id2 query params required' });

    const [snap1, snap2] = await Promise.all([
      DataSnapshot.findById(id1).lean(),
      DataSnapshot.findById(id2).lean(),
    ]);

    if (!snap1 || !snap2) return res.status(404).json({ message: 'One or both snapshots not found' });

    const changes = {};
    const allKeys = new Set([...Object.keys(snap1.data || {}), ...Object.keys(snap2.data || {})]);
    for (const key of allKeys) {
      const v1 = snap1.data?.[key];
      const v2 = snap2.data?.[key];
      if (v1 !== v2) {
        changes[key] = { from: v1, to: v2, diff: typeof v2 === 'number' && typeof v1 === 'number' ? v2 - v1 : null };
      }
    }

    return res.status(200).json({
      snapshot1: { id: snap1._id, source: snap1.source, region: snap1.region, date: snap1.snapshotDate, revision: snap1.revision, data: snap1.data },
      snapshot2: { id: snap2._id, source: snap2.source, region: snap2.region, date: snap2.snapshotDate, revision: snap2.revision, data: snap2.data },
      changes,
      revisionNote: snap2.revisionNote || '',
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to compare snapshots' });
  }
};
