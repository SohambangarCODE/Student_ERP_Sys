// backend/models/Student.js
const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  instituteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute', required: true },
  admissionNumber: { type: String, required: true },
  name: { type: String, required: true },
  dateOfBirth: { type: Date },
  gender: { type: String, enum: ['male', 'female', 'other'] },
  batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch' },
  parentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  guardianContact: {
    name: String,
    phone: String,
    relation: String,
  },
  documents: [{
    type: { type: String }, // e.g. 'aadhaar', 'transfer_certificate'
    url: String,
  }],
  status: { type: String, enum: ['active', 'inactive', 'graduated', 'dropped'], default: 'active' },
}, { timestamps: true });

studentSchema.index({ instituteId: 1, admissionNumber: 1 }, { unique: true });

module.exports = mongoose.model('Student', studentSchema);