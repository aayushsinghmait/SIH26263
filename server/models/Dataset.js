import mongoose from 'mongoose';

const DatasetSchema = new mongoose.Schema({
  datasetId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  owningMinistry: { type: String, required: true },
  ministryCode: { type: String, required: true },
  category: { type: String, default: 'GENERAL' },
  sensitivity: { type: String, default: 'RESTRICTED' },
  purpose: { type: String, default: '' },
  supportedSearchKeys: [{ type: String }],
  sharingAgreementActive: { type: Boolean, default: true },
  permittedUseCases: [{ type: String }],
  availableFields: [{
    field: String,
    type: { type: String },
    description: String
  }],
  records: [{ type: mongoose.Schema.Types.Mixed }]
}, { timestamps: true });

export default mongoose.models.Dataset || mongoose.model('Dataset', DatasetSchema);
