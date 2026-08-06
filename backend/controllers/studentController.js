const Student = require('../models/Student');

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
      return res.status(409).json({ message: 'Admission number already exists in this institute' });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/students
exports.getStudents = async (req, res) => {
  try {
    const students = await Student.find({ instituteId: req.user.instituteId })
      .populate('batchId', 'name')
      .sort({ createdAt: -1 });
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/students/:id
exports.getStudentById = async (req, res) => {
  try {
    const student = await Student.findOne({
      _id: req.params.id,
      instituteId: req.user.instituteId, // <-- this is the line that stops Institute A from fetching Institute B's student by guessing an ID
    }).populate('batchId', 'name').populate('parentIds', 'name email phone');

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.json(student);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
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
      { new: true, runValidators: true }
    );

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.json(student);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
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
      return res.status(404).json({ message: 'Student not found' });
    }
    res.json({ message: 'Student deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};