const mongoose = require('mongoose');
const FeeStructure = require('../models/FeeStructure');
const FeePayment = require('../models/FeePayment');
const Student = require('../models/Student');

// ---------- FEE STRUCTURE ----------

// POST /api/fees/structure
exports.createFeeStructure = async (req, res) => {
  try {
    const feeStructure = await FeeStructure.create({
      ...req.body,
      instituteId: req.user.instituteId,
    });
    res.status(201).json(feeStructure);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/fees/structure
exports.getFeeStructures = async (req, res) => {
  try {
    const structures = await FeeStructure.find({ instituteId: req.user.instituteId })
      .populate('batchId', 'name');
    res.json(structures);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ---------- FEE PAYMENT ----------

// POST /api/fees/payment
exports.recordPayment = async (req, res) => {
  try {
    const { studentId, feeStructureId, amountPaid, paymentMethod, transactionRef } = req.body;

    // Verify the student actually belongs to this institute before recording a payment.
    const student = await Student.findOne({ _id: studentId, instituteId: req.user.instituteId });
    if (!student) {
      return res.status(404).json({ message: 'Student not found in this institute' });
    }

    const receiptNumber = `RCPT-${Date.now()}`;

    const payment = await FeePayment.create({
      instituteId: req.user.instituteId,
      studentId,
      feeStructureId,
      amountPaid,
      paymentMethod,
      transactionRef,
      receiptNumber,
    });

    res.status(201).json(payment);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/fees/payment/student/:studentId
exports.getPaymentsByStudent = async (req, res) => {
  try {
    const payments = await FeePayment.find({
      instituteId: req.user.instituteId,
      studentId: req.params.studentId,
    }).sort({ paymentDate: -1 });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ---------- DEFAULTER LIST (aggregation pipeline) ----------

// GET /api/fees/defaulters
exports.getDefaulters = async (req, res) => {
  try {
    const instituteId = new mongoose.Types.ObjectId(req.user.instituteId);

    const result = await FeeStructure.aggregate([
      { $match: { instituteId } },

      {
        $lookup: {
          from: 'students',
          let: { batchId: '$batchId', instId: '$instituteId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$batchId', '$$batchId'] },
                    { $eq: ['$instituteId', '$$instId'] },
                  ],
                },
              },
            },
          ],
          as: 'students',
        },
      },

      { $unwind: '$students' },

      {
        $lookup: {
          from: 'feepayments',
          let: { studentId: '$students._id', feeStructId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$studentId', '$$studentId'] },
                    { $eq: ['$feeStructureId', '$$feeStructId'] },
                  ],
                },
              },
            },
            { $group: { _id: null, totalPaid: { $sum: '$amountPaid' } } },
          ],
          as: 'paymentInfo',
        },
      },

      {
        $addFields: {
          totalPaid: { $ifNull: [{ $arrayElemAt: ['$paymentInfo.totalPaid', 0] }, 0] },
        },
      },
      {
        $addFields: {
          balanceDue: { $subtract: ['$totalAmount', '$totalPaid'] },
        },
      },

      { $match: { balanceDue: { $gt: 0 } } },

      {
        $project: {
          _id: 0,
          studentId: '$students._id',
          studentName: '$students.name',
          admissionNumber: '$students.admissionNumber',
          totalAmount: 1,
          totalPaid: 1,
          balanceDue: 1,
        },
      },
    ]);

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};