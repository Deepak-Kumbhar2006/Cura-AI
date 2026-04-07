const mongoose = require('mongoose');

const healthRecordSchema = new mongoose.Schema(
  {
    symptoms: [{ type: String }],
    location: {
      city: { type: String, required: true },
      region: { type: String, required: true },
      lat: Number,
      lng: Number,
    },
    environmental: {
      temperature: { type: Number, required: true },
      humidity: { type: Number, required: true },
    },
    prediction: {
      probability: Number,
      risk: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
      },
      disease: { type: String, default: 'Respiratory Infection' },
    },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recordedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('HealthRecord', healthRecordSchema);
