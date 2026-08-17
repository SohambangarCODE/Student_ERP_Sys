const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { createStaffSchema, updateStaffSchema } = require('../validations/staff.validation');
const {
  createStaff,
  getStaff,
  getStaffById,
  updateStaff,
  deactivateStaff,
} = require('../controllers/staffController');

router.use(protect);
router.use(restrictTo('super_admin', 'branch_admin')); // entire module is admin-only

router.post('/', validate(createStaffSchema), createStaff);
router.get('/', getStaff);
router.get('/:id', getStaffById);
router.put('/:id', validate(updateStaffSchema), updateStaff);
router.delete('/:id', deactivateStaff);

module.exports = router;