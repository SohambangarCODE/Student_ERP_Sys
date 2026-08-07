const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const {
  createStaff,
  getStaff,
  getStaffById,
  updateStaff,
  deactivateStaff,
} = require('../controllers/staffController');

router.use(protect);
router.use(restrictTo('super_admin', 'branch_admin')); // entire module is admin-only

router.post('/', createStaff);
router.get('/', getStaff);
router.get('/:id', getStaffById);
router.put('/:id', updateStaff);
router.delete('/:id', deactivateStaff);

module.exports = router;