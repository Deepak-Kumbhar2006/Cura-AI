const HealthRecord = require('../models/HealthRecord');

function recordToRow(rec) {
  return {
    id: rec._id,
    patientName: rec.personalDetails?.name || '',
    age: rec.personalDetails?.age || '',
    gender: rec.personalDetails?.gender || '',
    city: rec.location?.city || '',
    region: rec.location?.region || '',
    lat: rec.location?.lat || '',
    lng: rec.location?.lng || '',
    symptoms: (rec.symptoms || []).map((s) => s.name).join('; '),
    bodyTemperature: rec.vitals?.bodyTemperature || '',
    spo2: rec.vitals?.spo2 || '',
    heartRate: rec.vitals?.heartRate || '',
    humidity: rec.humidity || '',
    durationDays: rec.durationDays || '',
    risk: rec.risk || '',
    probability: rec.probability || '',
    diagnosis: rec.diagnosis?.diseaseName || '',
    diagnosisSeverity: rec.diagnosis?.severity || '',
    diagnosisStatus: rec.diagnosis?.status || '',
    createdAt: rec.createdAt ? new Date(rec.createdAt).toISOString() : '',
  };
}

function toCsv(records) {
  if (records.length === 0) return '';
  const rows = records.map(recordToRow);
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(',')];
  for (const row of rows) {
    const vals = headers.map((h) => {
      const v = String(row[h] || '');
      return v.includes(',') || v.includes('"') || v.includes('\n')
        ? `"${v.replace(/"/g, '""')}"`
        : v;
    });
    lines.push(vals.join(','));
  }
  return lines.join('\n');
}

function toJsonExport(records, filters) {
  return {
    exportedAt: new Date().toISOString(),
    filters: filters || {},
    totalRecords: records.length,
    records: records.map(recordToRow),
  };
}

async function queryRecords({ region, disease, risk, dateFrom, dateTo, limit = 1000 }) {
  const query = {};
  if (region) query['location.region'] = String(region);
  if (disease) query['diagnosis.diseaseName'] = String(disease);
  if (risk) query.risk = String(risk);
  if (dateFrom || dateTo) {
    query.createdAt = {};
    if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
    if (dateTo) query.createdAt.$lte = new Date(dateTo);
  }

  return HealthRecord.find(query)
    .sort({ createdAt: -1 })
    .limit(Math.min(Number(limit) || 1000, 5000))
    .lean();
}

module.exports = { toCsv, toJsonExport, queryRecords, recordToRow };
