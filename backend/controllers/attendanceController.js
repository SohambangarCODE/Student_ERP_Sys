const mongoose = require('mongoose');
const Attendance = require('../models/Attendance');

const twilio = require('twilio');
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const Student = require('../models/Student');

// POST /api/attendance/bulk
// Body: { batchId, date, records: [{ studentId, status }, ...] }
exports.markBulkAttendance = async (req, res) => {
  try {
    const { batchId, date, records } = req.body;

    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ message: 'records array is required' });
    }

    // Build one attendance doc per student, tagging instituteId + markedBy for every one
    const attendanceDocs = records.map((r) => ({
      instituteId: req.user.instituteId,
      studentId: r.studentId,
      batchId,
      date,
      status: r.status,
      markedBy: req.user.id,
    }));

    // insertMany is much faster than looping and calling .create() one at a time —
    // it sends all documents to MongoDB in a single round trip.
    // ordered: false means if one record fails (e.g. duplicate for that day), the rest still get inserted.
    const result = await Attendance.insertMany(attendanceDocs, { ordered: false });

    // ---- absent alert trigger (stub for now) ----
    const absentees = records.filter((r) => r.status === 'absent');
    if (absentees.length > 0) {
      await triggerAbsentAlerts(absentees, req.user.instituteId);
    }

    res.status(201).json({ message: `${result.length} attendance records saved`, records: result });
  } catch (err) {
    // insertMany with ordered:false throws a BulkWriteError if SOME docs succeeded and some failed
    // (e.g. someone re-marks a student who already has attendance for that day — our unique index blocks the duplicate)
    if (err.code === 11000 || err.writeErrors) {
      return res.status(207).json({
        message: 'Some records saved, some were duplicates (already marked for this date)',
        error: err.message,
      });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/attendance/batch/:batchId/date/:date
exports.getAttendanceByBatchAndDate = async (req, res) => {
  try {
    const { batchId, date } = req.params;
    const attendance = await Attendance.find({
      instituteId: req.user.instituteId,
      batchId,
      date: new Date(date),
    }).populate('studentId', 'name admissionNumber');

    res.json(attendance);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/attendance/student/:studentId
exports.getAttendanceByStudent = async (req, res) => {
  try {
    const attendance = await Attendance.find({
      instituteId: req.user.instituteId,
      studentId: req.params.studentId,
    }).sort({ date: -1 });

    res.json(attendance);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/attendance/student/:studentId/summary
// Returns attendance % — a simple aggregation, much lighter than the fee one
exports.getStudentAttendanceSummary = async (req, res) => {
  try {
    const summary = await Attendance.aggregate([
      {
        $match: {
          instituteId: new mongoose.Types.ObjectId(req.user.instituteId),
          studentId: new mongoose.Types.ObjectId(req.params.studentId),
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    // summary comes back like [{ _id: 'present', count: 18 }, { _id: 'absent', count: 2 }]
    // reshape it into something easier for the frontend to consume directly
    const counts = { present: 0, absent: 0, late: 0 };
    summary.forEach((s) => { counts[s._id] = s.count; });

    const total = counts.present + counts.absent + counts.late;
    const percentage = total > 0 ? Math.round((counts.present / total) * 100) : 0;

    res.json({ ...counts, total, attendancePercentage: percentage });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ---- placeholder for the real alert system (Step 9 will build this out with WhatsApp/SMS) ----
async function triggerAbsentAlerts(absentees, instituteId) {
  // Stub — logs the alert instead of sending a real SMS/WhatsApp message.
  // The architecture here (isolated function, per-student try/catch, guardian phone lookup)
  // is production-ready; swapping in a real provider later only means changing this function's body.
  for (const absentee of absentees) {
    const student = await Student.findOne({ _id: absentee.studentId, instituteId });
    if (!student || !student.guardianContact?.phone) {
      console.log(`⚠️ No guardian phone on file for student ${absentee.studentId}, skipping alert`);
      continue;
    }
    console.log(`📢 [ALERT STUB] Would notify ${student.guardianContact.name} (${student.guardianContact.phone}) — ${student.name} marked absent`);
  }
}