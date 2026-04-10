const { getAllSourceStatuses, getSourceFreshness } = require('../services/apiReliabilityService');

// Feature 3: Data latency & freshness
exports.getFreshness = async (_req, res) => {
  try {
    const freshness = await getSourceFreshness();
    return res.status(200).json({ sources: freshness, checkedAt: new Date().toISOString() });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch data freshness' });
  }
};

// Feature 4: API reliability
exports.getApiStatuses = async (_req, res) => {
  try {
    const statuses = await getAllSourceStatuses();
    return res.status(200).json({ sources: statuses, checkedAt: new Date().toISOString() });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch API statuses' });
  }
};

// Feature 16: Metadata display
exports.getMetadata = async (_req, res) => {
  try {
    const freshness = await getSourceFreshness();
    const metadata = freshness.map((s) => ({
      source: s.name,
      lastUpdated: s.lastUpdated,
      dataAge: s.latencyLabel,
      status: s.status,
      method: 'REST API polling',
    }));
    return res.status(200).json({
      metadata,
      systemInfo: {
        version: '1.0.0',
        service: 'cura-ai-server',
        uptime: Math.floor(process.uptime()),
      },
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch metadata' });
  }
};
