const Student = require("../models/Student");
const Batch = require("../models/Batch");
const Attendance = require("../models/Attendance");
const ExamResult = require("../models/ExamResult");
const FeePayment = require("../models/FeePayment");
const User = require("../models/User");
const Message = require("../models/Message");

// PUT /api/students/:id/remove-batch — unassign from batch, keep everything else intact
exports.removeFromBatch = async (req, res) => {
  try {
    const student = await Student.findOneAndUpdate(
      { _id: req.params.id, instituteId: req.user.instituteId },
      { batchId: null },
      { new: true },
    );
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    res.json(student);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// PUT /api/students/:id/unlink-parent
// Body: { parentId }
exports.unlinkParent = async (req, res) => {
  try {
    const { parentId } = req.body;
    const { id: studentId } = req.params;

    const student = await Student.findOne({
      _id: studentId,
      instituteId: req.user.instituteId,
    });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Remove the link from BOTH sides of the relationship — this is exactly the mistake
    // we just found and had to fix by hand in Atlas: only fixing Student.parentIds and
    // forgetting User.children leaves the parent still able to see a child that isn't theirs.
    await Student.updateOne(
      { _id: studentId },
      { $pull: { parentIds: parentId } },
    );
    await User.updateOne(
      { _id: parentId, instituteId: req.user.instituteId },
      { $pull: { children: studentId } },
    );

    const updated = await Student.findById(studentId).populate(
      "parentIds",
      "name email phone",
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// PUT /api/students/:id/status — soft delete via status change (e.g. mark as 'dropped')
// This is the SAFE, reversible-in-spirit option — all history stays intact, student just
// stops showing up in active rosters, attendance-marking lists, fee defaulter lists, etc.
exports.updateStudentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["active", "inactive", "graduated", "dropped"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const student = await Student.findOneAndUpdate(
      { _id: req.params.id, instituteId: req.user.instituteId },
      { status },
      { new: true },
    );
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    res.json(student);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// DELETE /api/students/:id/permanent — THE destructive option, cascades across every related collection
exports.permanentlyDeleteStudent = async (req, res) => {
  try {
    const student = await Student.findOne({
      _id: req.params.id,
      instituteId: req.user.instituteId,
    });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const { instituteId } = req.user;
    const studentId = student._id;

    // Delete every record that references this student, across every module we've built.
    // Order doesn't matter here since none of these deletions depend on each other completing first —
    // but we still run them as a clear, explicit list so it's obvious exactly what gets touched.
    await Promise.all([
      Attendance.deleteMany({ instituteId, studentId }),
      ExamResult.deleteMany({ instituteId, studentId }),
      FeePayment.deleteMany({ instituteId, studentId }),
      Message.deleteMany({ instituteId, studentId }),
      // Remove this student's ID from any parent account's `children` array,
      // rather than deleting the parent account itself — a parent may have other children.
      User.updateMany(
        { instituteId, children: studentId },
        { $pull: { children: studentId } },
      ),
    ]);

    await Student.deleteOne({ _id: studentId });

    res.json({
      message: "Student and all related records permanently deleted",
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// POST /api/students
exports.createStudent = async (req, res) => {
  try {
    const student = await Student.create({
      ...req.body,
      instituteId: req.user.instituteId, // NEVER trust instituteId from req.body — always from the token
    });
    res.status(201).json(student);
  } catch (err) {
    if (err.code === 11000) {
      return res
        .status(409)
        .json({ message: "Admission number already exists in this institute" });
    }
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// GET /api/students
exports.getStudents = async (req, res) => {
  try {
    const students = await Student.find({ instituteId: req.user.instituteId })
      .populate("batchId", "name")
      .populate("parentIds", "name email phone")
      .sort({ createdAt: -1 });
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// GET /api/students/:id
exports.getStudentById = async (req, res) => {
  try {
    const student = await Student.findOne({
      _id: req.params.id,
      instituteId: req.user.instituteId, // <-- this is the line that stops Institute A from fetching Institute B's student by guessing an ID
    })
      .populate("batchId", "name")
      .populate("parentIds", "name email phone");

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    res.json(student);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// PUT /api/students/:id
exports.updateStudent = async (req, res) => {
  try {
    // findOneAndUpdate with instituteId in the filter — same reasoning as above.
    // If someone from Institute B sends Institute A's student ID, this returns null, not someone else's data.
    const student = await Student.findOneAndUpdate(
      { _id: req.params.id, instituteId: req.user.instituteId },
      req.body,
      { new: true, runValidators: true },
    );

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    res.json(student);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// DELETE /api/students/:id
exports.deleteStudent = async (req, res) => {
  try {
    const student = await Student.findOneAndDelete({
      _id: req.params.id,
      instituteId: req.user.instituteId,
    });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    res.json({ message: "Student deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
