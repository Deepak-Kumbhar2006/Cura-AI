const { toCsv, toJsonExport, queryRecords } = require('../services/exportService');
const { logAction } = require('../services/auditService');

exports.exportData = async (req, res) => {
  try {
    const { format, region, disease, risk, dateFrom, dateTo, limit } = req.query;
    const filters = { region, disease, risk, dateFrom, dateTo };
    const records = await queryRecords({ ...filters, limit: limit || 1000 });

    await logAction({
      action: 'export',
      userId: req.user?.id,
      resourceType: 'HealthRecord',
      details: { format: format || 'json', filters, recordCount: records.length },
    });

    if (format === 'csv') {
      const csv = toCsv(records);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="cura-ai-export-${Date.now()}.csv"`);
      return res.send(csv);
    }

    const data = toJsonExport(records, filters);
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to export data' });
  }
};
