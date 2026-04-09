const mongoose = require('mongoose');

const doctorMonthlyReportSchema = new mongoose.Schema(
  {
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    month: { type: String, required: true },
    region: { type: String, required: true },
    summary: { type: String, required: true },
    totalCasesReviewed: { type: Number, default: 0 },
    highRiskCount: { type: Number, default: 0 },
    dominantDisease: { type: String, default: '' },
    recommendations: [{ type: String }],
  },
  { timestamps: true }
);

doctorMonthlyReportSchema.index({ doctorId: 1, month: 1, region: 1 }, { unique: true });

module.exports = mongoose.model('DoctorMonthlyReport', doctorMonthlyReportSchema);
