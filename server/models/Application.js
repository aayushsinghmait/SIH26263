import mongoose from 'mongoose';

const ApplicationSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  scheme_name: {
    type: String,
    default: 'National Welfare Scheme'
  },
  applicant_name: {
    type: String,
    required: true
  },
  dob: {
    type: String,
    default: ''
  },
  gender: {
    type: String,
    default: ''
  },
  father_name: {
    type: String,
    default: ''
  },
  aadhaar_no: {
    type: String,
    default: ''
  },
  pan_no: {
    type: String,
    default: ''
  },
  education_roll: {
    type: String,
    default: ''
  },
  claimed_income: {
    type: String,
    default: ''
  },
  state: {
    type: String,
    default: ''
  },
  pin_code: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['PENDING_AI_CHECK', 'VERIFIED', 'NEEDS_REVIEW', 'FLAGGED', 'APPROVED', 'REJECTED'],
    default: 'PENDING_AI_CHECK'
  },
  ai_verdict: {
    type: String,
    enum: ['PENDING', 'PASS', 'FAIL', 'NEEDS_REVIEW'],
    default: 'PENDING'
  },
  confidence_score: {
    type: Number,
    default: 0
  },
  submitted_at: {
    type: String,
    default: () => new Date().toISOString().replace('T', ' ').slice(0, 19)
  },
  custom_fields: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  verification_report: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  reviewer_decision: {
    decision: String,
    reviewer: String,
    notes: String,
    timestamp: String
  }
}, { timestamps: true });

export default mongoose.models.Application || mongoose.model('Application', ApplicationSchema);
