const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const { createParent, getMyChildren, getChildSummary, getChildFeeDetails } = require('../controllers/parentController');

router.use(protect);

router.post('/', restrictTo('super_admin', 'branch_admin', 'front_desk'), createParent);
router.get('/me/children', restrictTo('parent'), getMyChildren);
router.get('/me/children/:studentId/summary', restrictTo('parent'), getChildSummary);
router.get('/me/children/:studentId/fees', restrictTo('parent'), getChildFeeDetails);

module.exports = router;