const mongoose = require('mongoose');

const dataQualityLogSchema = new mongoose.Schema(
  {
    recordId: { type: mongoose.Schema.Types.ObjectId, ref: 'HealthRecord' },
    source: { type: String, default: 'user-submission' },
    qualityScore: { type: Number, min: 0, max: 100, required: true },
    flags: [
      {
        type: { type: String, enum: ['incomplete', 'delayed', 'duplicate', 'outlier', 'invalid'] },
        field: String,
        message: String,
      },
    ],
    validationPassed: { type: Boolean, default: true },
    checkedBy: { type: String, default: 'system' },
  },
  { timestamps: true }
);

dataQualityLogSchema.index({ recordId: 1 });
dataQualityLogSchema.index({ qualityScore: 1 });
dataQualityLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('DataQualityLog', dataQualityLogSchema);
