const mongoose = require('mongoose');

const symptomSchema = new mongoose.Schema(
  {
    name: String,
    severity: { type: String, enum: ['Low', 'High', 'Mild', 'Moderate', 'Severe'], default: 'Low' },
  },
  { _id: false }
);

const diagnosisSchema = new mongoose.Schema(
  {
    diseaseName: String,
    severity: { type: String, enum: ['Mild', 'Moderate', 'Severe'] },
    status: { type: String, enum: ['Suspected', 'Confirmed', 'Recovered'], default: 'Suspected' },
    medicines: String,
    advice: String,
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedAt: Date,
  },
  { _id: false }
);

const healthRecordSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    personalDetails: {
      name: String,
      age: Number,
      gender: String,
      city: String,
      area: String,
      pincode: String,
    },
    symptoms: [symptomSchema],
    location: {
      city: { type: String, required: true },
      area: String,
      pincode: String,
      region: { type: String, required: true },
      lat: Number,
      lng: Number,
    },
    vitals: {
      bodyTemperature: Number,
      spo2: Number,
      heartRate: Number,
    },
    humidity: Number,
    durationDays: Number,
    medicalReportUrl: String,
    risk: { type: String, enum: ['Low', 'Medium', 'High'], required: true },
    probability: { type: Number, required: true },
    explanation: { type: String, default: '' },
    aiSignals: {
      externalRisk: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Low' },
      gdeltCount: { type: Number, default: 0 },
      meteoAvgHumidity: { type: Number, default: 0 },
      boost: { type: Number, default: 0 },
    },
    diagnosis: diagnosisSchema,
    bulkMeta: {
      isBulkEntry: { type: Boolean, default: false },
      numberOfCases: Number,
      diseaseType: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('HealthRecord', healthRecordSchema);
