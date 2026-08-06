// backend/models/Institute.js
const mongoose = require('mongoose');

const instituteSchema = new mongoose.Schema({
  name: { type: String, required: true },
  logoUrl: { type: String },
  address: { type: String },
  contactPhone: { type: String },
  contactEmail: { type: String },
  subscriptionPlan: { 
    type: String, 
    enum: ['starter', 'growth', 'multi-branch'], 
    default: 'starter' 
  },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Institute', instituteSchema);