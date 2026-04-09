const mongoose = require('mongoose');

const medicalReportSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fileUrl: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    notes: { type: String, default: '' },
    tags: [{ type: String }],
    reportDate: { type: Date, default: Date.now },
    clinicalFlags: {
      highFever: { type: Boolean, default: false },
      lowSpo2: { type: Boolean, default: false },
      respiratoryDistress: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MedicalReport', medicalReportSchema);
