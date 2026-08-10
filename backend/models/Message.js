const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  instituteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // NEW — the specific staff member this thread is with
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderRole: { type: String, required: true },
  content: { type: String, required: true },
  read: { type: Boolean, default: false },
}, { timestamps: true });

// A conversation is now uniquely (studentId, parentId, staffId) — one thread PER staff member, not one big shared inbox
messageSchema.index({ instituteId: 1, studentId: 1, parentId: 1, staffId: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);