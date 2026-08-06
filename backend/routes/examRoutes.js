const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const {
  createExam,
  getExams,
  getExamById,
  enterMarks,
  getResultsByStudent,
  getExamRankings,
} = require('../controllers/examController');

router.use(protect);

router.post('/', restrictTo('super_admin', 'branch_admin', 'teacher'), createExam);
router.get('/', getExams);
router.get('/:id', getExamById);

router.post('/:examId/marks', restrictTo('super_admin', 'branch_admin', 'teacher'), enterMarks);
router.get('/:examId/rankings', getExamRankings);

router.get('/results/student/:studentId', getResultsByStudent);

module.exports = router;