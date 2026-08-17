const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const {
  createFeeStructureSchema,
  updateFeeStructureSchema,
  recordPaymentSchema,
  createRazorpayOrderSchema,
  verifyRazorpaySchema,
} = require('../validations/resources.validation');
const {
  createFeeStructure,
  getFeeStructures,
  recordPayment,
  getPaymentsByStudent,
  getDefaulters,
  createRazorpayOrder,
  verifyRazorpayPayment,
  updateFeeStructure,
  getFeeStructureForStudent,
} = require('../controllers/feeController');

router.use(protect);

router.post('/structure', restrictTo('super_admin', 'branch_admin', 'accountant'), validate(createFeeStructureSchema), createFeeStructure);
router.get('/structure', getFeeStructures);

router.post('/payment', restrictTo('super_admin', 'branch_admin', 'accountant', 'front_desk'), validate(recordPaymentSchema), recordPayment);
router.get('/payment/student/:studentId', getPaymentsByStudent);

router.get('/defaulters', restrictTo('super_admin', 'branch_admin', 'accountant'), getDefaulters);

router.put('/structure/:id', restrictTo('super_admin', 'branch_admin', 'accountant'), validate(updateFeeStructureSchema), updateFeeStructure);

router.post('/razorpay/order', validate(createRazorpayOrderSchema), createRazorpayOrder);
router.post('/razorpay/verify', validate(verifyRazorpaySchema), verifyRazorpayPayment);

router.get('/structure/for-student/:studentId', getFeeStructureForStudent);

module.exports = router;