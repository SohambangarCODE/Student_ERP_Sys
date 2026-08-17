const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { markBulkAttendanceSchema } = require('../validations/resources.validation');
const {
  markBulkAttendance,
  getAttendanceByBatchAndDate,
  getAttendanceByStudent,
  getStudentAttendanceSummary,
} = require('../controllers/attendanceController');

router.use(protect);

router.post('/bulk', restrictTo('super_admin', 'branch_admin', 'teacher'), validate(markBulkAttendanceSchema), markBulkAttendance);
router.get('/batch/:batchId/date/:date', getAttendanceByBatchAndDate);
router.get('/student/:studentId', getAttendanceByStudent);
router.get('/student/:studentId/summary', getStudentAttendanceSummary);

module.exports = router;