const HealthRecord = require('../models/HealthRecord');
const Alert = require('../models/Alert');
const { getPrediction } = require('../services/predictionService');
const { fetchWeather } = require('../services/weatherService');

exports.addRecord = async (req, res) => {
  try {
    const { symptoms = [], location } = req.body;
    if (!location?.city) return res.status(400).json({ message: 'City is required' });

    const weather = await fetchWeather(location.city);
    const weatherLocation = {
      city: location.city,
      region: location.region || weather.region || 'Unknown',
      lat: location.lat || weather.lat,
      lng: location.lng || weather.lng,
    };

    const prediction = await getPrediction({ symptoms, temperature: weather.temperature, humidity: weather.humidity });

    const explanation = `Risk is ${prediction.risk} due to ${symptoms.join(', ') || 'mild symptoms'} with temp ${weather.temperature}°C and humidity ${weather.humidity}%.`;

    const record = await HealthRecord.create({
      userId: req.user.id,
      symptoms,
      location: weatherLocation,
      temperature: weather.temperature,
      humidity: weather.humidity,
      risk: prediction.risk,
      probability: prediction.probability,
      explanation,
    });

    if (prediction.risk === 'High') {
      await Alert.create({
        location: `${weatherLocation.city}, ${weatherLocation.region}`,
        message: `High outbreak risk detected in ${weatherLocation.city}.`,
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
    const query = {};
    if (req.user.role === 'patient') query.userId = req.user.id;

    if (req.query.region) query['location.region'] = req.query.region;
    const records = await HealthRecord.find(query).sort({ createdAt: -1 }).limit(500);
    return res.status(200).json(records);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch data', error: error.message });
  }
};
