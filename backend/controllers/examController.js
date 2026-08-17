const mongoose = require('mongoose');
const Exam = require('../models/Exam');
const ExamResult = require('../models/ExamResult');
const Student = require('../models/Student');

// ---------- EXAM ----------

// POST /api/exams
exports.createExam = async (req, res, next) => {
  try {
    const exam = await Exam.create({
      ...req.body,
      instituteId: req.user.instituteId,
    });
    res.status(201).json(exam);
  } catch (err) {
    next(err);
  }
};

// GET /api/exams  (optional ?batchId=... filter via query param)
exports.getExams = async (req, res, next) => {
  try {
    const filter = { instituteId: req.user.instituteId };

    // Optional filter — only add batchId to the query if the client actually asked for it
    if (req.query.batchId) {
      filter.batchId = req.query.batchId;
    }

    const exams = await Exam.find(filter)
      .populate('batchId', 'name')
      .sort({ examDate: -1 });

    res.json(exams);
  } catch (err) {
    next(err);
  }
};

// GET /api/exams/:id
exports.getExamById = async (req, res, next) => {
  try {
    const exam = await Exam.findOne({
      _id: req.params.id,
      instituteId: req.user.instituteId,
    }).populate('batchId', 'name');

    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }
    res.json(exam);
  } catch (err) {
    next(err);
  }
};

// ---------- MARKS ENTRY ----------

// POST /api/exams/:examId/marks
// Body: { studentId, marks: [{ subjectName, marksObtained }, ...] }
exports.enterMarks = async (req, res, next) => {
  try {
    const { examId } = req.params;
    const { studentId, marks } = req.body;

    // Verify the exam actually belongs to this institute
    const exam = await Exam.findOne({ _id: examId, instituteId: req.user.instituteId });
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found in this institute' });
    }

    // Verify the student belongs to this institute too — same check pattern as recordPayment
    const student = await Student.findOne({ _id: studentId, instituteId: req.user.instituteId });
    if (!student) {
      return res.status(404).json({ message: 'Student not found in this institute' });
    }

    const result = await ExamResult.create({
      instituteId: req.user.instituteId,
      examId,
      studentId,
      marks,
      enteredBy: req.user.id,
    });

    res.status(201).json(result);
  } catch (err) {
    // Unique index (instituteId+examId+studentId) blocks entering marks twice for the same student+exam
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Marks already entered for this student in this exam' });
    }
    next(err);
  }
};

// GET /api/exams/results/student/:studentId
exports.getResultsByStudent = async (req, res, next) => {
  try {
    const { studentId } = req.params;

    // If a parent is calling this, they may ONLY view their own children — never another student's results.
    // Staff roles (teacher, admin, etc.) can view any student in their institute, so this check only applies to parents.
    if (req.user.role === 'parent') {
      const isOwnChild = (req.user.children || []).some((id) => id.toString() === studentId);
      if (!isOwnChild) {
        return res.status(403).json({ message: 'You do not have access to this student' });
      }
    }

    const results = await ExamResult.find({
      instituteId: req.user.instituteId,
      studentId,
    })
      .populate('examId', 'name examDate subjects')
      .sort({ createdAt: -1 });

    res.json(results);
  } catch (err) {
    next(err);
  }
};

// ---------- RANKINGS (aggregation) ----------

// GET /api/exams/:examId/rankings
exports.getExamRankings = async (req, res, next) => {
  try {
    const examId = new mongoose.Types.ObjectId(req.params.examId);
    const instituteId = new mongoose.Types.ObjectId(req.user.instituteId);

    const rankings = await ExamResult.aggregate([
      { $match: { instituteId, examId } },

      {
        $addFields: {
          totalScore: { $sum: '$marks.marksObtained' },
        },
      },

      {
        $lookup: {
          from: 'students',
          localField: 'studentId',
          foreignField: '_id',
          as: 'student',
        },
      },
      { $unwind: '$student' },

      { $sort: { totalScore: -1 } },

      {
        $project: {
          _id: 0,
          studentId: 1,
          studentName: '$student.name',
          totalScore: 1,
        },
      },
    ]);

    const withRank = rankings.map((r, index) => ({ ...r, rank: index + 1 }));

    res.json(withRank);
  } catch (err) {
    next(err);
  }
};