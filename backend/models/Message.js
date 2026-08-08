const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  instituteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true }, // which child this conversation is about
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },     // which parent this thread belongs to
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderRole: { type: String, required: true },
  content: { type: String, required: true },
  read: { type: Boolean, default: false },
}, { timestamps: true });

// One thread = one (studentId, parentId) pair — this index makes fetching a thread fast
messageSchema.index({ instituteId: 1, studentId: 1, parentId: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);