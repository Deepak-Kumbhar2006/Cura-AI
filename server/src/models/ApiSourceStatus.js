const mongoose = require('mongoose');

const apiSourceStatusSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    url: { type: String, default: '' },
    lastSuccess: { type: Date, default: null },
    lastFailure: { type: Date, default: null },
    lastResponseMs: { type: Number, default: 0 },
    avgResponseMs: { type: Number, default: 0 },
    successCount: { type: Number, default: 0 },
    failureCount: { type: Number, default: 0 },
    uptime: { type: Number, default: 100 },
    lastDataTimestamp: { type: Date, default: null },
    dataLatencyHours: { type: Number, default: 0 },
    status: { type: String, enum: ['healthy', 'degraded', 'down'], default: 'healthy' },
    fallbackSource: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ApiSourceStatus', apiSourceStatusSchema);
