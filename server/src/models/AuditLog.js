const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: ['data_ingestion', 'data_update', 'data_delete', 'alert_triggered', 'export', 'login', 'processing', 'api_call', 'threshold_change', 'role_change'],
      required: true,
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    resourceType: { type: String, default: '' },
    resourceId: { type: mongoose.Schema.Types.ObjectId },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
    ip: { type: String, default: '' },
    userAgent: { type: String, default: '' },
    status: { type: String, enum: ['success', 'failure', 'warning'], default: 'success' },
  },
  { timestamps: true }
);

auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ resourceType: 1, resourceId: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
