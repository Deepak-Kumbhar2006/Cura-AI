const HealthRecord = require('../models/HealthRecord');
const Alert = require('../models/Alert');
const { getPrediction } = require('../services/predictionService');
const { fetchWeather } = require('../services/weatherService');
const MedicalReport = require('../models/MedicalReport');
const { assessQuality, logQuality } = require('../services/dataQualityService');
const { standardizeLocation } = require('../services/geoStandardizationService');
const { logAction } = require('../services/auditService');

const safePredict = async ({ symptoms, temperature, humidity }) => {
  try {
    return await getPrediction({ symptoms, temperature, humidity });
  } catch (_error) {
    const score = (symptoms.includes('fever') ? 0.35 : 0) + (symptoms.includes('cough') ? 0.25 : 0) + (temperature >= 38 ? 0.2 : 0) + (humidity >= 75 ? 0.15 : 0);
    return { probability: Number(score.toFixed(2)), risk: score >= 0.75 ? 'High' : score >= 0.45 ? 'Medium' : 'Low' };
  }
};

exports.addRecord = async (req, res) => {
  try {
    const { personalDetails = {}, symptoms = [], location = {}, vitals = {}, durationDays, medicalReportUrl } = req.body;
    if (!location.city) return res.status(400).json({ message: 'City is required' });

    // Feature 13: Geo-data standardization
    const stdLocation = standardizeLocation(location);

    // Feature 1: Data quality assessment
    const quality = await assessQuality(req.body, req.user.id);

    const weather = await fetchWeather(stdLocation.city);
    const symptomNames = symptoms.map((s) => (typeof s === 'string' ? s : s.name)).filter(Boolean).map((s) => s.toLowerCase());

    const prediction = await safePredict({
      symptoms: symptomNames,
      temperature: vitals.bodyTemperature || weather.temperature,
      humidity: weather.humidity,
    });

    const latestReport = await MedicalReport.findOne({ patientId: req.user.id }).sort({ createdAt: -1 }).lean();
    const reportSignalBoost = latestReport && (
      latestReport.clinicalFlags?.highFever ||
      latestReport.clinicalFlags?.lowSpo2 ||
      latestReport.clinicalFlags?.respiratoryDistress
    )
      ? 0.08
      : 0;
    const adjustedProbability = Math.min(0.99, Number((prediction.probability + reportSignalBoost).toFixed(2)));
    const adjustedRisk = adjustedProbability >= 0.75 ? 'High' : adjustedProbability >= 0.45 ? 'Medium' : 'Low';

    const normalizedLocation = {
      city: stdLocation.city,
      area: stdLocation.area || '',
      pincode: stdLocation.pincode || '',
      region: stdLocation.region || weather.region || stdLocation.city,
      lat: stdLocation.lat || weather.lat,
      lng: stdLocation.lng || weather.lng,
    };

    const explanation = `Risk ${adjustedRisk}: symptoms ${symptomNames.join(', ') || 'none'} with temp ${vitals.bodyTemperature || weather.temperature}°C and humidity ${weather.humidity}%.`;

    const record = await HealthRecord.create({
      userId: req.user.id,
      personalDetails,
      symptoms: symptoms.map((s) => (typeof s === 'string' ? { name: s, severity: 'Low' } : s)),
      location: normalizedLocation,
      vitals,
      humidity: weather.humidity,
      durationDays,
      medicalReportUrl,
      risk: adjustedRisk,
      probability: adjustedProbability,
      explanation,
    });

    if (adjustedRisk === 'High') {
      await Alert.create({
        location: `${normalizedLocation.city}, ${normalizedLocation.area || normalizedLocation.region}`,
        message: `Spike detected: high-risk case reported from ${normalizedLocation.city}.`,
        risk: 'High',
        recordId: record._id,
      });
    }

    // Feature 1: Log data quality
    await logQuality(record._id, quality.qualityScore, quality.flags, quality.validationPassed);

    // Feature 5: Audit log
    await logAction({
      action: 'data_ingestion',
      userId: req.user.id,
      resourceType: 'HealthRecord',
      resourceId: record._id,
      details: { qualityScore: quality.qualityScore, risk: adjustedRisk },
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.status(201).json({ ...record.toObject(), qualityScore: quality.qualityScore, qualityFlags: quality.flags });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to add data' });
  }
};

exports.getAllRecords = async (req, res) => {
  try {
    const query = req.user.role === 'patient' ? { userId: req.user.id } : {};
    if (req.query.region) query['location.region'] = String(req.query.region);
    if (req.query.status) query['diagnosis.status'] = String(req.query.status);

    const records = await HealthRecord.find(query).sort({ createdAt: -1 }).limit(500);
    return res.status(200).json(records);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch data' });
  }
};

exports.getMyRecords = async (req, res) => {
  try {
    const records = await HealthRecord.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(200);
    return res.status(200).json(records);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch your records' });
  }
};

exports.getRecordById = async (req, res) => {
  try {
    const rec = await HealthRecord.findById(req.params.id);
    if (!rec) return res.status(404).json({ message: 'Case not found' });
    if (req.user.role === 'patient' && String(rec.userId) !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
    return res.status(200).json(rec);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch case' });
  }
};

exports.addDiagnosis = async (req, res) => {
  try {
    const { diseaseName, severity, status, medicines, advice } = req.body;
    if (!diseaseName) return res.status(400).json({ message: 'Disease name is required' });
    const updated = await HealthRecord.findByIdAndUpdate(
      req.params.id,
      { $set: { diagnosis: { diseaseName, severity, status, medicines, advice, updatedBy: req.user.id, updatedAt: new Date() } } },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: 'Case not found' });

    await logAction({
      action: 'data_update',
      userId: req.user.id,
      resourceType: 'HealthRecord',
      resourceId: updated._id,
      details: { diseaseName, severity, status },
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.status(200).json(updated);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update diagnosis' });
  }
};

exports.bulkEntry = async (req, res) => {
  try {
    const { numberOfCases, diseaseType, region } = req.body;
    if (!numberOfCases || !diseaseType || !region) return res.status(400).json({ message: 'numberOfCases, diseaseType and region are required' });
    const count = Math.min(Number(numberOfCases), 500);

    const docs = Array.from({ length: count }).map(() => ({
      userId: req.user.id,
      personalDetails: { name: 'Bulk entry', city: region, area: region, pincode: 'N/A' },
      symptoms: [{ name: diseaseType, severity: 'Moderate' }],
      location: { city: region, area: region, pincode: 'N/A', region },
      vitals: { bodyTemperature: 37, spo2: 97, heartRate: 80 },
      humidity: 60,
      durationDays: 2,
      risk: 'Medium',
      probability: 0.6,
      explanation: `Bulk hospital entry for ${diseaseType}`,
      bulkMeta: { isBulkEntry: true, numberOfCases: count, diseaseType },
    }));

    await HealthRecord.insertMany(docs);
    if (count > 20) {
      await Alert.create({ location: region, message: `Bulk spike detected: ${count} ${diseaseType} cases added in ${region}.`, risk: 'High' });
    }
    return res.status(201).json({ inserted: count });
  } catch (error) {
    return res.status(500).json({ message: 'Bulk entry failed' });
  }
};
