const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
  {
    location: { type: String, required: true },
    message: { type: String, required: true },
    risk: { type: String, enum: ['Low', 'Medium', 'High'], required: true },
    timestamp: { type: Date, default: Date.now },
    recordId: { type: mongoose.Schema.Types.ObjectId, ref: 'HealthRecord' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Alert', alertSchema);
