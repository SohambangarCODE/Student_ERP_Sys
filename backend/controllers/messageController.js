const Message = require('../models/Message');
const Student = require('../models/Student');
const User = require('../models/User');
const Batch = require('../models/Batch');

const ROLE_INFO = {
  teacher: { label: 'Teacher', description: 'Classes, homework, and academic progress' },
  branch_admin: { label: 'Branch Admin', description: 'Admissions, general institute matters' },
  super_admin: { label: 'Admin', description: 'Overall institute management' },
  front_desk: { label: 'Front Desk', description: 'Admissions, enquiries, and receipts' },
  accountant: { label: 'Accountant', description: 'Fee payments and receipts' },
};


// GET /api/messages/contacts/:studentId — PARENT ONLY: every staff member this parent could message about this child
exports.getAvailableContacts = async (req, res, next) => {
  try {
    const { studentId } = req.params;

    const isOwnChild = (req.user.children || []).some((id) => id.toString() === studentId);
    if (!isOwnChild) {
      return res.status(403).json({ message: 'You do not have access to this student' });
    }

    const student = await Student.findOne({ _id: studentId, instituteId: req.user.instituteId }).populate({
      path: 'batchId',
      populate: { path: 'teacherId', select: 'name' },
    });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const contacts = [];

    // The student's specific assigned teacher goes first — most relevant, most specific contact
    if (student.batchId?.teacherId) {
      contacts.push({
        _id: student.batchId.teacherId._id,
        name: student.batchId.teacherId.name,
        role: 'teacher',
        label: ROLE_INFO.teacher.label,
        description: `${ROLE_INFO.teacher.description} for ${student.batchId.name}`,
      });
    }

    // Every other active staff member at the institute, grouped by role, excluding the teacher already listed above
    const staff = await User.find({
      instituteId: req.user.instituteId,
      role: { $in: ['super_admin', 'branch_admin', 'accountant', 'front_desk', 'teacher'] },
      isActive: true,
      _id: { $ne: student.batchId?.teacherId?._id }, // don't list the assigned teacher twice
    }).select('name role');

    staff.forEach((s) => {
      const info = ROLE_INFO[s.role] || { label: s.role, description: '' };
      contacts.push({ _id: s._id, name: s.name, role: s.role, label: info.label, description: info.description });
    });

    res.json(contacts);
  } catch (err) {
    next(err);
  }
};

// POST /api/messages
// Body: { studentId, staffId (required if sender is parent), content }
exports.sendMessage = async (req, res, next) => {
  try {
    const { studentId, content } = req.body;
    let { staffId } = req.body;
    let parentId;

    if (req.user.role === 'parent') {
      const isOwnChild = (req.user.children || []).some((id) => id.toString() === studentId);
      if (!isOwnChild) {
        return res.status(403).json({ message: 'You do not have access to this student' });
      }
      if (!staffId) {
        return res.status(400).json({ message: 'staffId is required — choose who to message' });
      }
      parentId = req.user.id;
    } else {
      // Staff replying: parentId must be provided (which parent's thread), staffId is just themself
      parentId = req.body.parentId;
      staffId = req.user.id;
      if (!parentId) {
        return res.status(400).json({ message: 'parentId is required when staff sends a message' });
      }
    }

    const student = await Student.findOne({ _id: studentId, instituteId: req.user.instituteId });
    if (!student) {
      return res.status(404).json({ message: 'Student not found in this institute' });
    }

    const message = await Message.create({
      instituteId: req.user.instituteId,
      studentId,
      parentId,
      staffId,
      senderId: req.user.id,
      senderRole: req.user.role,
      content,
    });

    res.status(201).json(message);
  } catch (err) {
    next(err);
  }
};

// GET /api/messages/thread/:studentId?staffId=...   (parent side)
// GET /api/messages/thread/:studentId?parentId=...  (staff side — staffId is implicitly themself)
exports.getThread = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    let parentId, staffId;

    if (req.user.role === 'parent') {
      const isOwnChild = (req.user.children || []).some((id) => id.toString() === studentId);
      if (!isOwnChild) {
        return res.status(403).json({ message: 'You do not have access to this student' });
      }
      parentId = req.user.id;
      staffId = req.query.staffId;
      if (!staffId) {
        return res.status(400).json({ message: 'staffId query param is required' });
      }
    } else {
      parentId = req.query.parentId;
      staffId = req.user.id; // staff can ONLY ever see threads where THEY are the staff party — the real fix
      if (!parentId) {
        return res.status(400).json({ message: 'parentId query param is required' });
      }
    }

    const messages = await Message.find({
      instituteId: req.user.instituteId,
      studentId,
      parentId,
      staffId,
    }).sort({ createdAt: 1 });

    await Message.updateMany(
      {
        instituteId: req.user.instituteId,
        studentId,
        parentId,
        staffId,
        senderRole: req.user.role === 'parent' ? { $ne: 'parent' } : 'parent',
        read: false,
      },
      { read: true }
    );

    res.json(messages);
  } catch (err) {
    next(err);
  }
};

// GET /api/messages/threads — STAFF ONLY: list of conversations WHERE THIS STAFF MEMBER IS A PARTICIPANT
exports.getAllThreads = async (req, res, next) => {
  try {
    const mongoose = require('mongoose');
    const staffId = new mongoose.Types.ObjectId(req.user.id); // the critical fix — scope to self

    const threads = await Message.aggregate([
      {
        $match: {
          instituteId: new mongoose.Types.ObjectId(req.user.instituteId),
          staffId, // <-- ONLY conversations this staff member is actually part of
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: { studentId: '$studentId', parentId: '$parentId' },
          lastMessage: { $first: '$content' },
          lastMessageAt: { $first: '$createdAt' },
          unreadCount: {
            $sum: { $cond: [{ $and: [{ $eq: ['$read', false] }, { $eq: ['$senderRole', 'parent'] }] }, 1, 0] },
          },
        },
      },
      { $sort: { lastMessageAt: -1 } },
      { $lookup: { from: 'students', localField: '_id.studentId', foreignField: '_id', as: 'student' } },
      { $unwind: '$student' },
      { $lookup: { from: 'users', localField: '_id.parentId', foreignField: '_id', as: 'parent' } },
      { $unwind: '$parent' },
      {
        $project: {
          _id: 0,
          studentId: '$_id.studentId',
          parentId: '$_id.parentId',
          studentName: '$student.name',
          parentName: '$parent.name',
          lastMessage: 1,
          lastMessageAt: 1,
          unreadCount: 1,
        },
      },
    ]);

    res.json(threads);
  } catch (err) {
    next(err);
  }
};