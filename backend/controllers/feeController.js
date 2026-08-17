const mongoose = require('mongoose');
const FeeStructure = require('../models/FeeStructure');
const FeePayment = require('../models/FeePayment');
const Student = require('../models/Student');

const Razorpay = require('razorpay');
const crypto = require('crypto');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// GET /api/fees/structure/for-student/:studentId — the ONE fee structure matching this student's batch, with live totals
exports.getFeeStructureForStudent = async (req, res) => {
  try {
    const student = await Student.findOne({ _id: req.params.studentId, instituteId: req.user.instituteId });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    if (!student.batchId) {
      return res.json(null); // no batch assigned, so no fee structure could apply — not an error, just nothing to show
    }

    const structure = await FeeStructure.findOne({
      instituteId: req.user.instituteId,
      batchId: student.batchId,
    });

    if (!structure) {
      return res.json(null);
    }

    const payments = await FeePayment.find({
      instituteId: req.user.instituteId,
      studentId: student._id,
      feeStructureId: structure._id,
    });
    const totalPaid = payments.reduce((sum, p) => sum + p.amountPaid, 0);

    res.json({
      _id: structure._id,
      totalAmount: structure.totalAmount,
      totalPaid,
      balanceDue: structure.totalAmount - totalPaid,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};


// PUT /api/fees/structure/:id
exports.updateFeeStructure = async (req, res) => {
  try {
    const { batchId, totalAmount, installments } = req.body;

    const structure = await FeeStructure.findOneAndUpdate(
      { _id: req.params.id, instituteId: req.user.instituteId },
      { batchId, totalAmount, installments },
      { new: true, runValidators: true }
    ).populate('batchId', 'name');

    if (!structure) {
      return res.status(404).json({ message: 'Fee structure not found' });
    }

    res.json(structure);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// POST /api/fees/razorpay/order
// Step 1 of the flow — create an order with Razorpay, return its ID to the frontend
exports.createRazorpayOrder = async (req, res) => {
  try {
    const { amount } = req.body; // amount in rupees, e.g. 7500

    const order = await razorpay.orders.create({
      amount: amount * 100, // Razorpay expects the smallest currency unit — paise, not rupees
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    });

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create payment order', error: err.message });
  }
};

// POST /api/fees/razorpay/verify
// Step 2 — after checkout succeeds, verify the signature, THEN record the real FeePayment
exports.verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, studentId, feeStructureId, amountPaid } = req.body;

    // Recreate the signature ourselves using our secret key, compare to what Razorpay sent back.
    // If they match, we KNOW this response genuinely came from Razorpay and wasn't faked.
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Payment verification failed — signature mismatch' });
    }


    // A parent may only ever pay fees for their own child — same ownership rule as everywhere else in this module.
    if (req.user.role === 'parent') {
      const isOwnChild = (req.user.children || []).some((id) => id.toString() === studentId);
      if (!isOwnChild) {
        return res.status(403).json({ message: 'You cannot pay fees for this student' });
      }
    }
    
    // Verified — now it's safe to record it as a real payment, same as your existing recordPayment logic
    const student = await Student.findOne({ _id: studentId, instituteId: req.user.instituteId });
    if (!student) {
      return res.status(404).json({ message: 'Student not found in this institute' });
    }

    const payment = await FeePayment.create({
      instituteId: req.user.instituteId,
      studentId,
      feeStructureId,
      amountPaid,
      paymentMethod: 'razorpay',
      transactionRef: razorpay_payment_id,
      receiptNumber: `RCPT-${Date.now()}`,
    });

    res.status(201).json(payment);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

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