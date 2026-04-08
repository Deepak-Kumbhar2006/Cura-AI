const HealthRecord = require('../models/HealthRecord');
const Alert = require('../models/Alert');
const { getPrediction } = require('../services/predictionService');
const { fetchWeather } = require('../services/weatherService');
const { getExternalRiskSignals } = require('../services/externalDataService');

const safePredict = async ({ symptoms, temperature, humidity }) => {
  try {
    return await getPrediction({ symptoms, temperature, humidity });
  } catch (_error) {
    const score = (symptoms.includes('fever') ? 0.35 : 0) + (symptoms.includes('cough') ? 0.25 : 0) + (temperature >= 38 ? 0.2 : 0) + (humidity >= 75 ? 0.15 : 0);
    return { probability: Number(score.toFixed(2)), risk: score >= 0.75 ? 'High' : score >= 0.45 ? 'Medium' : 'Low' };
  }
};

const ensureVitals = (vitals = {}) => ({
  bodyTemperature: Number(vitals.bodyTemperature) || undefined,
  spo2: Number(vitals.spo2) || undefined,
  heartRate: Number(vitals.heartRate) || undefined,
});

const validSeverity = new Set(['Low', 'Mild', 'Moderate', 'High', 'Severe']);
const riskToWeight = { Low: 0.25, Medium: 0.55, High: 0.82 };

exports.addRecord = async (req, res) => {
  try {
    const { personalDetails = {}, symptoms = [], location = {}, vitals = {}, durationDays, medicalReportUrl } = req.body;
    if (!location.city) return res.status(400).json({ message: 'City is required' });
    if (!Array.isArray(symptoms) || symptoms.length === 0) return res.status(400).json({ message: 'At least one symptom is required' });

    const weather = await fetchWeather(location.city);
    const symptomNames = symptoms.map((s) => (typeof s === 'string' ? s : s.name)).filter(Boolean).map((s) => s.toLowerCase());
    if (!symptomNames.length) return res.status(400).json({ message: 'Symptoms are invalid' });
    const normalizedVitals = ensureVitals(vitals);

    const prediction = await safePredict({
      symptoms: symptomNames,
      temperature: normalizedVitals.bodyTemperature || weather.temperature,
      humidity: weather.humidity,
    });
    const externalSignals = await getExternalRiskSignals({
      city: location.city,
      country: 'India',
      humidity: weather.humidity,
      symptomNames,
    }).catch(() => ({
      city: location.city,
      country: 'India',
      gdeltCount: 0,
      meteoAvgHumidity: weather.humidity,
      boost: 0,
      externalRisk: 'Low',
      gdeltTopHeadlines: [],
      cached: false,
    }));

    const baseProb = Number(prediction.probability || riskToWeight[prediction.risk] || 0.35);
    const adjustedProbability = Math.min(0.99, Number((baseProb + externalSignals.boost).toFixed(2)));
    const finalRisk = adjustedProbability >= 0.75 ? 'High' : adjustedProbability >= 0.45 ? 'Medium' : 'Low';

    const normalizedLocation = {
      city: location.city,
      area: location.area || '',
      pincode: location.pincode || '',
      region: location.region || weather.region || location.city,
      lat: location.lat || weather.lat,
      lng: location.lng || weather.lng,
    };

    const explanation = `Risk ${finalRisk}: symptoms ${symptomNames.join(', ') || 'none'} with temp ${normalizedVitals.bodyTemperature || weather.temperature}°C, humidity ${weather.humidity}% and external signal boost ${externalSignals.boost}.`;

    const record = await HealthRecord.create({
      userId: req.user.id,
      personalDetails,
      symptoms: symptoms.map((s) => (typeof s === 'string' ? { name: s, severity: 'Low' } : s)),
      location: normalizedLocation,
      vitals: normalizedVitals,
      humidity: weather.humidity,
      durationDays,
      medicalReportUrl,
      risk: finalRisk,
      probability: adjustedProbability,
      explanation,
      aiSignals: {
        externalRisk: externalSignals.externalRisk,
        gdeltCount: externalSignals.gdeltCount,
        meteoAvgHumidity: externalSignals.meteoAvgHumidity,
        boost: externalSignals.boost,
      },
    });

    if (finalRisk === 'High') {
      await Alert.create({
        location: `${normalizedLocation.city}, ${normalizedLocation.area || normalizedLocation.region}`,
        message: `Spike detected: high-risk case reported from ${normalizedLocation.city}. External risk: ${externalSignals.externalRisk}.`,
        risk: 'High',
        recordId: record._id,
      });
    }

    // Cluster alert: same city+area and overlapping symptoms in last 48h
    const recentInArea = await HealthRecord.find({
      'location.city': normalizedLocation.city,
      'location.area': normalizedLocation.area,
      createdAt: { $gte: new Date(Date.now() - 48 * 60 * 60 * 1000) },
    }).select('symptoms');

    const similarCount = recentInArea.filter((r) => {
      const existing = new Set((r.symptoms || []).map((s) => s.name?.toLowerCase()).filter(Boolean));
      return symptomNames.some((s) => existing.has(s));
    }).length;

    if (similarCount >= 3) {
      await Alert.create({
        location: `${normalizedLocation.city}, ${normalizedLocation.area || normalizedLocation.region}`,
        message: `Potential cluster detected in ${normalizedLocation.area || normalizedLocation.city}: multiple patients reported similar symptoms in 48 hours.`,
        risk: finalRisk === 'High' ? 'High' : 'Medium',
        recordId: record._id,
      });
    }

    return res.status(201).json(record);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to add data', error: error.message });
  }
};

exports.uploadMedicalReport = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const base = `${req.protocol}://${req.get('host')}`;
    return res.status(201).json({
      message: 'Upload successful',
      url: `${base}/uploads/${req.file.filename}`,
      filename: req.file.filename,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Upload failed', error: error.message });
  }
};

exports.getAllRecords = async (req, res) => {
  try {
    const query = req.user.role === 'patient' ? { userId: req.user.id } : {};
    if (req.query.region) query['location.region'] = req.query.region;
    if (req.query.status) query['diagnosis.status'] = req.query.status;

    const records = await HealthRecord.find(query).sort({ createdAt: -1 }).limit(500);
    return res.status(200).json(records);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch data', error: error.message });
  }
};

exports.getMyRecords = async (req, res) => {
  try {
    const records = await HealthRecord.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(200);
    return res.status(200).json(records);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch your records', error: error.message });
  }
};

exports.getRecordById = async (req, res) => {
  try {
    const rec = await HealthRecord.findById(req.params.id);
    if (!rec) return res.status(404).json({ message: 'Case not found' });
    if (req.user.role === 'patient' && String(rec.userId) !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
    return res.status(200).json(rec);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch case', error: error.message });
  }
};

exports.addDiagnosis = async (req, res) => {
  try {
    const { diseaseName, severity, status, medicines, advice } = req.body;
    if (!diseaseName) return res.status(400).json({ message: 'Disease name is required' });
    if (severity && !validSeverity.has(severity)) return res.status(400).json({ message: 'Invalid severity' });
    if (status && !['Suspected', 'Confirmed', 'Recovered'].includes(status)) return res.status(400).json({ message: 'Invalid status' });
    const updated = await HealthRecord.findByIdAndUpdate(
      req.params.id,
      { $set: { diagnosis: { diseaseName, severity, status, medicines, advice, updatedBy: req.user.id, updatedAt: new Date() } } },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: 'Case not found' });
    return res.status(200).json(updated);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update diagnosis', error: error.message });
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
    return res.status(500).json({ message: 'Bulk entry failed', error: error.message });
  }
};
