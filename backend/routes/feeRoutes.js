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
const { createRazorpayOrder, verifyRazorpayPayment } = require('../controllers/feeController');
const { updateFeeStructure } = require('../controllers/feeController');

router.use(protect);

router.post('/structure', restrictTo('super_admin', 'branch_admin', 'accountant'), createFeeStructure);
router.get('/structure', getFeeStructures);

router.post('/payment', restrictTo('super_admin', 'branch_admin', 'accountant', 'front_desk'), recordPayment);
router.get('/payment/student/:studentId', getPaymentsByStudent);

router.get('/defaulters', restrictTo('super_admin', 'branch_admin', 'accountant'), getDefaulters);

router.put('/structure/:id', restrictTo('super_admin', 'branch_admin', 'accountant'), updateFeeStructure);

router.post('/razorpay/order', createRazorpayOrder);
router.post('/razorpay/verify', verifyRazorpayPayment);

module.exports = router;