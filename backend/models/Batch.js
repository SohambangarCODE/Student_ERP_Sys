// backend/models/Batch.js
const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema({
  instituteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute', required: true },
  name: { type: String, required: true }, // e.g. "Class 10-A" or "NEET Batch 2026"
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  schedule: [{
    day: String, // "Monday"
    startTime: String, // "16:00"
    endTime: String,
  }],
}, { timestamps: true });

module.exports = mongoose.model('Batch', batchSchema);