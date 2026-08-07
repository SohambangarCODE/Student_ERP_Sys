const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema({
  instituteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute', required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  // If batchId is null, this notice is institute-wide. If set, it's only for that batch's students/parents/teacher.
  batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Notice', noticeSchema);