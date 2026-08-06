// backend/models/FeeStructure.js
const mongoose = require('mongoose');

const feeStructureSchema = new mongoose.Schema({
  instituteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute', required: true },
  batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true },
  totalAmount: { type: Number, required: true },
  installments: [{
    label: String, // "Installment 1"
    amount: Number,
    dueDate: Date,
  }],
}, { timestamps: true });

module.exports = mongoose.model('FeeStructure', feeStructureSchema);