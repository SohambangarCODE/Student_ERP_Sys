const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const {
  createStudentSchema,
  updateStudentSchema,
  updateStatusSchema,
  unlinkParentSchema,
} = require('../validations/student.validation');
const {
  createStudent,
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  removeFromBatch,
  updateStudentStatus,
  permanentlyDeleteStudent,
  unlinkParent,
} = require('../controllers/studentController');

router.use(protect); // every route below this line requires a valid JWT

router.post('/', restrictTo('super_admin', 'branch_admin', 'front_desk'), validate(createStudentSchema), createStudent);
router.get('/', getStudents);
router.get('/:id', getStudentById);
router.put('/:id', restrictTo('super_admin', 'branch_admin', 'front_desk'), validate(updateStudentSchema), updateStudent);
router.delete('/:id', restrictTo('super_admin', 'branch_admin'), deleteStudent);

router.put('/:id/remove-batch', restrictTo('super_admin', 'branch_admin', 'front_desk'), removeFromBatch);
router.put('/:id/status', restrictTo('super_admin', 'branch_admin'), validate(updateStatusSchema), updateStudentStatus);
router.delete('/:id/permanent', restrictTo('super_admin'), permanentlyDeleteStudent);
router.put('/:id/unlink-parent', restrictTo('super_admin', 'branch_admin', 'front_desk'), validate(unlinkParentSchema), unlinkParent);

module.exports = router;