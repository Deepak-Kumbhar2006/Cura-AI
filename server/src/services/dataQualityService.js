const DataQualityLog = require('../models/DataQualityLog');
const HealthRecord = require('../models/HealthRecord');

const REQUIRED_FIELDS = ['location.city', 'location.region', 'symptoms', 'risk', 'probability'];
const VITALS_RANGES = {
  bodyTemperature: { min: 34, max: 43 },
  spo2: { min: 50, max: 100 },
  heartRate: { min: 30, max: 220 },
};

function validateSchema(body) {
  const flags = [];
  if (!body.location || !body.location.city) {
    flags.push({ type: 'incomplete', field: 'location.city', message: 'City is missing' });
  }
  if (!body.symptoms || !Array.isArray(body.symptoms) || body.symptoms.length === 0) {
    flags.push({ type: 'incomplete', field: 'symptoms', message: 'Symptoms array is empty or missing' });
  }
  if (body.vitals) {
    for (const [key, range] of Object.entries(VITALS_RANGES)) {
      const val = body.vitals[key];
      if (val != null && (val < range.min || val > range.max)) {
        flags.push({ type: 'outlier', field: `vitals.${key}`, message: `${key} value ${val} is outside normal range (${range.min}-${range.max})` });
      }
    }
  }
  if (body.personalDetails) {
    if (body.personalDetails.age != null && (body.personalDetails.age < 0 || body.personalDetails.age > 150)) {
      flags.push({ type: 'outlier', field: 'personalDetails.age', message: `Age ${body.personalDetails.age} is outside valid range` });
    }
  }
  return flags;
}

function handleMissingValues(body) {
  const flags = [];
  const filled = { ...body };
  if (!filled.vitals) filled.vitals = {};
  if (filled.vitals.bodyTemperature == null) {
    filled.vitals.bodyTemperature = 37;
    flags.push({ type: 'incomplete', field: 'vitals.bodyTemperature', message: 'Default value applied (37)' });
  }
  if (filled.vitals.spo2 == null) {
    filled.vitals.spo2 = 97;
    flags.push({ type: 'incomplete', field: 'vitals.spo2', message: 'Default value applied (97)' });
  }
  if (filled.vitals.heartRate == null) {
    filled.vitals.heartRate = 75;
    flags.push({ type: 'incomplete', field: 'vitals.heartRate', message: 'Default value applied (75)' });
  }
  if (!filled.durationDays) {
    filled.durationDays = 1;
    flags.push({ type: 'incomplete', field: 'durationDays', message: 'Default value applied (1)' });
  }
  return { filled, flags };
}

async function detectDuplicates(userId, symptoms, city) {
  const flags = [];
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const symptomNames = (symptoms || []).map((s) => (typeof s === 'string' ? s : s.name)).filter(Boolean);
  if (symptomNames.length === 0) return flags;

  const recent = await HealthRecord.find({
    userId,
    'location.city': city,
    createdAt: { $gte: cutoff },
  }).lean();

  for (const rec of recent) {
    const existingNames = (rec.symptoms || []).map((s) => s.name).filter(Boolean);
    const overlap = symptomNames.filter((n) => existingNames.includes(n));
    if (overlap.length >= Math.ceil(symptomNames.length * 0.8)) {
      flags.push({ type: 'duplicate', field: 'record', message: `Possible duplicate of record ${rec._id} (${overlap.length}/${symptomNames.length} symptoms match within 24h)` });
      break;
    }
  }
  return flags;
}

function computeQualityScore(body, flags) {
  let score = 100;
  const fieldCount = REQUIRED_FIELDS.length;
  let presentCount = 0;
  for (const path of REQUIRED_FIELDS) {
    const parts = path.split('.');
    let val = body;
    for (const p of parts) val = val ? val[p] : undefined;
    if (val != null && val !== '' && !(Array.isArray(val) && val.length === 0)) presentCount++;
  }
  const completeness = (presentCount / fieldCount) * 40;
  score = completeness;

  const incompleteCount = flags.filter((f) => f.type === 'incomplete').length;
  const outlierCount = flags.filter((f) => f.type === 'outlier').length;
  const duplicateCount = flags.filter((f) => f.type === 'duplicate').length;

  score += Math.max(0, 30 - incompleteCount * 10);
  score += Math.max(0, 20 - outlierCount * 10);
  score += duplicateCount > 0 ? 0 : 10;

  return Math.round(Math.min(100, Math.max(0, score)));
}

async function assessQuality(body, userId) {
  const schemaFlags = validateSchema(body);
  const { filled, flags: missingFlags } = handleMissingValues(body);
  const dupFlags = await detectDuplicates(userId, body.symptoms, body.location?.city);
  const allFlags = [...schemaFlags, ...missingFlags, ...dupFlags];
  const qualityScore = computeQualityScore(body, allFlags);
  const validationPassed = schemaFlags.filter((f) => f.type === 'invalid').length === 0;

  return { filled, flags: allFlags, qualityScore, validationPassed };
}

async function logQuality(recordId, qualityScore, flags, validationPassed) {
  return DataQualityLog.create({
    recordId,
    qualityScore,
    flags,
    validationPassed,
  });
}

module.exports = { validateSchema, handleMissingValues, detectDuplicates, computeQualityScore, assessQuality, logQuality };
