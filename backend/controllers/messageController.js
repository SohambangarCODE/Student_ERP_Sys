const Message = require('../models/Message');
const Student = require('../models/Student');

// POST /api/messages
// Body: { studentId, content } — parentId is inferred based on who's sending
exports.sendMessage = async (req, res) => {
  try {
    const { studentId, content, parentId } = req.body;

    let resolvedParentId;

    if (req.user.role === 'parent') {
      // A parent can only message about their own child
      const isOwnChild = (req.user.children || []).some((id) => id.toString() === studentId);
      if (!isOwnChild) {
        return res.status(403).json({ message: 'You do not have access to this student' });
      }
      resolvedParentId = req.user.id;
    } else {
      // Staff replying needs to specify WHICH parent's thread they're replying to
      if (!parentId) {
        return res.status(400).json({ message: 'parentId is required when staff sends a message' });
      }
      resolvedParentId = parentId;
    }

    const student = await Student.findOne({ _id: studentId, instituteId: req.user.instituteId });
    if (!student) {
      return res.status(404).json({ message: 'Student not found in this institute' });
    }

    const message = await Message.create({
      instituteId: req.user.instituteId,
      studentId,
      parentId: resolvedParentId,
      senderId: req.user.id,
      senderRole: req.user.role,
      content,
    });

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/messages/thread/:studentId  — fetch full conversation for one student
// For a parent: their own thread. For staff: pass ?parentId= to specify which parent's thread.
exports.getThread = async (req, res) => {
  try {
    const { studentId } = req.params;
    let parentId;

    if (req.user.role === 'parent') {
      const isOwnChild = (req.user.children || []).some((id) => id.toString() === studentId);
      if (!isOwnChild) {
        return res.status(403).json({ message: 'You do not have access to this student' });
      }
      parentId = req.user.id;
    } else {
      parentId = req.query.parentId;
      if (!parentId) {
        return res.status(400).json({ message: 'parentId query param is required for staff' });
      }
    }

    const messages = await Message.find({
      instituteId: req.user.instituteId,
      studentId,
      parentId,
    }).sort({ createdAt: 1 });

    // Mark messages from the OTHER side as read, since this side just viewed them
    await Message.updateMany(
      { instituteId: req.user.instituteId, studentId, parentId, senderRole: req.user.role === 'parent' ? { $ne: 'parent' } : 'parent', read: false },
      { read: true }
    );

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/messages/threads  — STAFF ONLY: list of all conversations in the institute, most recent first
exports.getAllThreads = async (req, res) => {
  try {
    const threads = await Message.aggregate([
      { $match: { instituteId: new (require('mongoose').Types.ObjectId)(req.user.instituteId) } },
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
      {
        $lookup: { from: 'students', localField: '_id.studentId', foreignField: '_id', as: 'student' },
      },
      { $unwind: '$student' },
      {
        $lookup: { from: 'users', localField: '_id.parentId', foreignField: '_id', as: 'parent' },
      },
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
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};