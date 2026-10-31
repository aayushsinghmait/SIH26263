import mongoose from 'mongoose';

const ComplianceRuleSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  code: { type: String, required: true },
  name: { type: String, required: true },
  statute: { type: String, required: true },
  description: { type: String, default: '' },
  category: { type: String, default: 'GENERAL' },
  strictness: { type: String, default: 'MANDATORY_CRITICAL' },
  formula: { type: String, default: '' },
  active: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.models.ComplianceRule || mongoose.model('ComplianceRule', ComplianceRuleSchema);
