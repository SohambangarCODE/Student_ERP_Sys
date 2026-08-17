const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { createBatchSchema, updateBatchSchema } = require('../validations/resources.validation');
const {
  createBatch,
  getBatches,
  getBatchById,
  updateBatch,
  deleteBatch,
} = require('../controllers/batchController');

router.use(protect);

router.post('/', restrictTo('super_admin', 'branch_admin'), validate(createBatchSchema), createBatch);
router.get('/', getBatches);
router.get('/:id', getBatchById);
router.put('/:id', restrictTo('super_admin', 'branch_admin'), validate(updateBatchSchema), updateBatch);
router.delete('/:id', restrictTo('super_admin', 'branch_admin'), deleteBatch);

module.exports = router;