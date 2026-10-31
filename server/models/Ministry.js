import mongoose from 'mongoose';

const MinistrySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  code: { type: String, required: true },
  name: { type: String, required: true },
  category: { type: String, default: 'Regulatory Authority' },
  icon: { type: String, default: 'Building2' },
  adminEmail: { type: String, default: '' },
  status: { type: String, default: 'ACTIVE' },
  recordsCount: { type: Number, default: 0 },
  lastSync: { type: String, default: () => new Date().toISOString().replace('T', ' ').slice(0, 19) }
}, { timestamps: true });

export default mongoose.models.Ministry || mongoose.model('Ministry', MinistrySchema);
