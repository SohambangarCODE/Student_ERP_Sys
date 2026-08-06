const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
  instituteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute', required: true },
  batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true },
  name: { type: String, required: true }, // "Mid-Term 2026"
  examDate: { type: Date, required: true },
  subjects: [{
    name: { type: String, required: true },
    maxMarks: { type: Number, required: true },
  }],
}, { timestamps: true });

module.exports = mongoose.model('Exam', examSchema);