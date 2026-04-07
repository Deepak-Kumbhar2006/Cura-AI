require('dotenv').config();
const connectDB = require('../src/config/db');
const HealthRecord = require('../src/models/HealthRecord');

const seed = async () => {
  await connectDB();

  await HealthRecord.insertMany([
    {
      symptoms: ['fever', 'cough'],
      location: { city: 'Austin', region: 'Texas', lat: 30.2672, lng: -97.7431 },
      environmental: { temperature: 33, humidity: 72 },
      prediction: { probability: 0.84, risk: 'High', disease: 'Respiratory Infection' },
      reportedBy: '000000000000000000000001',
    },
  ]);

  console.log('Seed inserted');
  process.exit(0);
};

seed();
