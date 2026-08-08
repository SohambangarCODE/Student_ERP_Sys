const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Student = require('../models/Student');
const FeeStructure = require('../models/FeeStructure');
const FeePayment = require('../models/FeePayment');
const Attendance = require('../models/Attendance');
const Notice = require('../models/Notice');

// POST /api/parents  — admin/staff creates a parent account tied to one or more students
exports.createParent = async (req, res) => {
  try {
    const { name, email, password, phone, studentIds } = req.body;

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ message: 'At least one studentId is required' });
    }

    // Verify every student actually belongs to this institute before linking —
    // same tenant-safety check pattern used everywhere else (recordPayment, enterMarks).
    const students = await Student.find({ _id: { $in: studentIds }, instituteId: req.user.instituteId });
    if (students.length !== studentIds.length) {
      return res.status(404).json({ message: 'One or more students not found in this institute' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const parent = await User.create({
      instituteId: req.user.instituteId,
      name,
      email,
      password: hashedPassword,
      role: 'parent',
      phone,
      children: studentIds,
    });

    // Update the other side of the relationship too — each student should list this parent
    await Student.updateMany(
      { _id: { $in: studentIds } },
      { $addToSet: { parentIds: parent._id } } // $addToSet avoids duplicate entries if run twice
    );

    const { password: _, ...parentWithoutPassword } = parent.toObject();
    res.status(201).json(parentWithoutPassword);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Email already in use in this institute' });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/parents/me/children — a logged-in PARENT fetches their own children's basic info
exports.getMyChildren = async (req, res) => {
  try {
    const children = await Student.find({
      _id: { $in: req.user.children || [] },
      instituteId: req.user.instituteId,
    }).populate('batchId', 'name');

    res.json(children);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/parents/me/children/:studentId/summary — full dashboard data for ONE child
exports.getChildSummary = async (req, res) => {
  try {
    const { studentId } = req.params;

    // Critical check: this parent can only view a child that's actually theirs.
    // Without this, any logged-in parent could type another family's studentId in the URL
    // and see that child's fees/attendance — this is the parent-specific equivalent of
    // the instituteId check we use everywhere else.
    const isOwnChild = (req.user.children || []).some((id) => id.toString() === studentId);
    if (!isOwnChild) {
      return res.status(403).json({ message: 'You do not have access to this student' });
    }

    const student = await Student.findOne({ _id: studentId, instituteId: req.user.instituteId })
      .populate('batchId', 'name');

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const mongoose = require('mongoose');
    const instituteId = new mongoose.Types.ObjectId(req.user.instituteId);
    const studentObjId = new mongoose.Types.ObjectId(studentId);

    const [attendanceAgg, feeStructures, payments, notices] = await Promise.all([
      Attendance.aggregate([
        { $match: { instituteId, studentId: studentObjId } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      FeeStructure.find({ instituteId, batchId: student.batchId?._id }),
      FeePayment.find({ instituteId, studentId: studentObjId }),
      Notice.find({
        instituteId,
        $or: [{ batchId: null }, { batchId: student.batchId?._id }],
      }).sort({ createdAt: -1 }).limit(5),
    ]);

    const attendanceCounts = { present: 0, absent: 0, late: 0 };
    attendanceAgg.forEach((a) => { attendanceCounts[a._id] = a.count; });
    const totalDays = attendanceCounts.present + attendanceCounts.absent + attendanceCounts.late;
    const attendancePercentage = totalDays > 0 ? Math.round((attendanceCounts.present / totalDays) * 100) : 0;

    const totalOwed = feeStructures.reduce((sum, f) => sum + f.totalAmount, 0);
    const totalPaid = payments.reduce((sum, p) => sum + p.amountPaid, 0);

    res.json({
      student,
      attendance: { ...attendanceCounts, attendancePercentage },
      fees: { totalOwed, totalPaid, balanceDue: totalOwed - totalPaid },
      notices,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/parents/me/children/:studentId/fees
exports.getChildFeeDetails = async (req, res) => {
  try {
    const { studentId } = req.params;

    const isOwnChild = (req.user.children || []).some((id) => id.toString() === studentId);
    if (!isOwnChild) {
      return res.status(403).json({ message: 'You do not have access to this student' });
    }

    const student = await Student.findOne({ _id: studentId, instituteId: req.user.instituteId });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const structures = await FeeStructure.find({ instituteId: req.user.instituteId, batchId: student.batchId });

    // For each fee structure, compute how much THIS student has paid against it —
    // same aggregation logic as the defaulter list, just narrowed to one student instead of everyone.
    const structuresWithBalance = await Promise.all(
      structures.map(async (structure) => {
        const payments = await FeePayment.find({
          instituteId: req.user.instituteId,
          studentId,
          feeStructureId: structure._id,
        });
        const totalPaid = payments.reduce((sum, p) => sum + p.amountPaid, 0);
        return {
          _id: structure._id,
          totalAmount: structure.totalAmount,
          installments: structure.installments,
          totalPaid,
          balanceDue: structure.totalAmount - totalPaid,
        };
      })
    );

    res.json(structuresWithBalance);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};