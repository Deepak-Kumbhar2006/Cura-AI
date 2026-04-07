const HealthRecord = require('../models/HealthRecord');
const Alert = require('../models/Alert');
const { getPrediction } = require('../services/predictionService');
const { fetchWeather } = require('../services/weatherService');

exports.addRecord = async (req, res) => {
  try {
    const {
      personalDetails = {},
      symptoms = [],
      location = {},
      vitals = {},
      durationDays,
      medicalReportUrl,
    } = req.body;

    if (!location.city) return res.status(400).json({ message: 'City is required' });

    const weather = await fetchWeather(location.city);
    const symptomNames = symptoms.map((s) => (typeof s === 'string' ? s : s.name));

    const prediction = await getPrediction({
      symptoms: symptomNames,
      temperature: vitals.bodyTemperature || weather.temperature,
      humidity: weather.humidity,
    });

    const normalizedLocation = {
      city: location.city,
      area: location.area || '',
      pincode: location.pincode || '',
      region: location.region || weather.region || 'Unknown',
      lat: location.lat || weather.lat,
      lng: location.lng || weather.lng,
    };

    const explanation = `Risk ${prediction.risk}: symptoms ${symptomNames.join(', ')} with temp ${vitals.bodyTemperature || weather.temperature}°C and humidity ${weather.humidity}%.`;

    const record = await HealthRecord.create({
      userId: req.user.id,
      personalDetails,
      symptoms: symptoms.map((s) => (typeof s === 'string' ? { name: s, severity: 'Low' } : s)),
      location: normalizedLocation,
      vitals,
      humidity: weather.humidity,
      durationDays,
      medicalReportUrl,
      risk: prediction.risk,
      probability: prediction.probability,
      explanation,
    });

    if (prediction.risk === 'High') {
      await Alert.create({
        location: `${normalizedLocation.city}, ${normalizedLocation.area || normalizedLocation.region}`,
        message: `Spike detected: high-risk case reported from ${normalizedLocation.city}.`,
        risk: 'High',
        recordId: record._id,
      });
    }

    return res.status(201).json(record);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to add data', error: error.message });
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

exports.addDiagnosis = async (req, res) => {
  try {
    const { diseaseName, severity, status, medicines, advice } = req.body;
    const updated = await HealthRecord.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          diagnosis: {
            diseaseName,
            severity,
            status,
            medicines,
            advice,
            updatedBy: req.user.id,
            updatedAt: new Date(),
          },
        },
      },
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
    const docs = Array.from({ length: Number(numberOfCases || 0) }).map(() => ({
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
      bulkMeta: { isBulkEntry: true, numberOfCases, diseaseType },
    }));

    if (docs.length) await HealthRecord.insertMany(docs);
    return res.status(201).json({ inserted: docs.length });
  } catch (error) {
    return res.status(500).json({ message: 'Bulk entry failed', error: error.message });
  }
};
