const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const {
  createBatch,
  getBatches,
  getBatchById,
  updateBatch,
  deleteBatch,
} = require('../controllers/batchController');

router.use(protect);

router.post('/', restrictTo('super_admin', 'branch_admin'), createBatch);
router.get('/', getBatches);
router.get('/:id', getBatchById);
router.put('/:id', restrictTo('super_admin', 'branch_admin'), updateBatch);
router.delete('/:id', restrictTo('super_admin', 'branch_admin'), deleteBatch);

module.exports = router;