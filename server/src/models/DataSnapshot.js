const mongoose = require('mongoose');

const dataSnapshotSchema = new mongoose.Schema(
  {
    source: { type: String, required: true },
    region: { type: String, required: true },
    disease: { type: String, default: 'all' },
    snapshotDate: { type: Date, required: true },
    data: {
      totalCases: Number,
      activeCases: Number,
      recovered: Number,
      deaths: Number,
      newCases: Number,
    },
    revision: { type: Number, default: 1 },
    previousValues: { type: mongoose.Schema.Types.Mixed, default: null },
    revisionNote: { type: String, default: '' },
  },
  { timestamps: true }
);

dataSnapshotSchema.index({ source: 1, region: 1, snapshotDate: -1 });
dataSnapshotSchema.index({ disease: 1, snapshotDate: -1 });

module.exports = mongoose.model('DataSnapshot', dataSnapshotSchema);
