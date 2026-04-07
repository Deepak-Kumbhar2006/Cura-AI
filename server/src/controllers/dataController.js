const HealthRecord = require('../models/HealthRecord');
const Alert = require('../models/Alert');
const { getPrediction } = require('../services/predictionService');
const { sendHighRiskAlert } = require('../services/emailService');

exports.addRecord = async (req, res) => {
  try {
    const { symptoms, location, environmental } = req.body;

    const prediction = await getPrediction({ symptoms, location, environmental });

    const record = await HealthRecord.create({
      symptoms,
      location,
      environmental,
      prediction,
      reportedBy: req.user.id,
    });

    if (prediction.risk === 'High') {
      const alert = await Alert.create({
        message: `High outbreak risk detected in ${location.city}, ${location.region}. Probability: ${prediction.probability}`,
        risk: prediction.risk,
        city: location.city,
        region: location.region,
        recordId: record._id,
      });
      await sendHighRiskAlert(alert);
    }

    return res.status(201).json(record);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to add record', error: error.message });
  }
};

exports.getAllRecords = async (req, res) => {
  try {
    const { region, disease, startDate, endDate } = req.query;
    const query = {};

    if (region) query['location.region'] = region;
    if (disease) query['prediction.disease'] = disease;
    if (startDate || endDate) {
      query.recordedAt = {};
      if (startDate) query.recordedAt.$gte = new Date(startDate);
      if (endDate) query.recordedAt.$lte = new Date(endDate);
    }

    const records = await HealthRecord.find(query).sort({ recordedAt: -1 }).lean();
    return res.status(200).json(records);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch records', error: error.message });
  }
};
