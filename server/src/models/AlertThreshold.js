const mongoose = require('mongoose');

const alertThresholdSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    region: { type: String, default: 'all' },
    disease: { type: String, default: 'all' },
    metric: { type: String, enum: ['case_count', 'growth_rate', 'incidence_rate', 'cfr'], required: true },
    operator: { type: String, enum: ['gt', 'gte', 'lt', 'lte', 'eq'], required: true },
    value: { type: Number, required: true },
    enabled: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

alertThresholdSchema.index({ enabled: 1, region: 1, disease: 1 });

module.exports = mongoose.model('AlertThreshold', alertThresholdSchema);
