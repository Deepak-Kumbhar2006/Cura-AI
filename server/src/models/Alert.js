const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
  {
    message: { type: String, required: true },
    risk: { type: String, enum: ['Low', 'Medium', 'High'], required: true },
    city: { type: String, required: true },
    region: { type: String, required: true },
    active: { type: Boolean, default: true },
    recordId: { type: mongoose.Schema.Types.ObjectId, ref: 'HealthRecord' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Alert', alertSchema);
