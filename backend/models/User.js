// backend/models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  instituteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute', required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true }, // stored as bcrypt hash, never plain text
  role: { 
    type: String, 
    enum: ['super_admin', 'branch_admin', 'accountant', 'teacher', 'front_desk', 'parent'],
    required: true 
  },
  phone: { type: String },
  // Only relevant if role === 'parent': which students are theirs
  children: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Same email can exist across different institutes, but not twice within one institute
userSchema.index({ instituteId: 1, email: 1 }, { unique: true });

module.exports = mongoose.model('User', userSchema);