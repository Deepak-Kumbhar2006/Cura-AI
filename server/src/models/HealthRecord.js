const mongoose = require('mongoose');

const healthRecordSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    symptoms: [{ type: String, required: true }],
    location: {
      city: { type: String, required: true },
      region: { type: String, required: true },
      lat: Number,
      lng: Number,
    },
    temperature: Number,
    humidity: Number,
    risk: { type: String, enum: ['Low', 'Medium', 'High'], required: true },
    probability: { type: Number, required: true },
    explanation: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('HealthRecord', healthRecordSchema);
