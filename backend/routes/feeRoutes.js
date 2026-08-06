const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const {
  createFeeStructure,
  getFeeStructures,
  recordPayment,
  getPaymentsByStudent,
  getDefaulters,
} = require('../controllers/feeController');

router.use(protect);

router.post('/structure', restrictTo('super_admin', 'branch_admin', 'accountant'), createFeeStructure);
router.get('/structure', getFeeStructures);

router.post('/payment', restrictTo('super_admin', 'branch_admin', 'accountant'), recordPayment);
router.get('/payment/student/:studentId', getPaymentsByStudent);

router.get('/defaulters', restrictTo('super_admin', 'branch_admin', 'accountant'), getDefaulters);

module.exports = router;