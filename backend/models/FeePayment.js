// backend/models/FeePayment.js
const mongoose = require('mongoose');

const feePaymentSchema = new mongoose.Schema({
  instituteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  feeStructureId: { type: mongoose.Schema.Types.ObjectId, ref: 'FeeStructure', required: true },
  amountPaid: { type: Number, required: true },
  paymentDate: { type: Date, default: Date.now },
  paymentMethod: { type: String, enum: ['cash', 'upi', 'card', 'razorpay'] },
  transactionRef: { type: String }, // Razorpay payment ID, or manual receipt number
  receiptNumber: { type: String, required: true },
}, { timestamps: true });

feePaymentSchema.index({ instituteId: 1, studentId: 1 });

module.exports = mongoose.model('FeePayment', feePaymentSchema);