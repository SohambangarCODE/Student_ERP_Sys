const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const {
  createStudent,
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  removeFromBatch,
  updateStudentStatus,
  permanentlyDeleteStudent,
} = require('../controllers/studentController');
const { unlinkParent } = require('../controllers/studentController');

router.use(protect); // every route below this line requires a valid JWT

router.post('/', restrictTo('super_admin', 'branch_admin', 'front_desk'), createStudent);
router.get('/', getStudents); // any logged-in role can view (we'll refine per-role visibility later)
router.get('/:id', getStudentById);
router.put('/:id', restrictTo('super_admin', 'branch_admin', 'front_desk'), updateStudent);
router.delete('/:id', restrictTo('super_admin', 'branch_admin'), deleteStudent);

router.put('/:id/remove-batch', restrictTo('super_admin', 'branch_admin', 'front_desk'), removeFromBatch);
router.put('/:id/status', restrictTo('super_admin', 'branch_admin'), updateStudentStatus);
router.delete('/:id/permanent', restrictTo('super_admin'), permanentlyDeleteStudent); // only the top role can do this
router.put('/:id/unlink-parent', restrictTo('super_admin', 'branch_admin', 'front_desk'), unlinkParent);

module.exports = router;