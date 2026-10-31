import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  timestamp: { type: String, default: () => new Date().toISOString().replace('T', ' ').slice(0, 19) },
  actor: { type: String, default: 'Authorized Officer' },
  portal: { type: String, default: 'Central System' },
  action: { type: String, required: true },
  details: { type: String, default: '' },
  severity: { type: String, enum: ['INFO', 'SUCCESS', 'WARNING', 'DANGER'], default: 'INFO' }
}, { timestamps: true });

export default mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);
