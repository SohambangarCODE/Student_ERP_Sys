const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { createParentSchema, linkParentSchema, searchParentSchema } = require('../validations/parent.validation');
const {
  createParent,
  getMyChildren,
  getChildSummary,
  getChildFeeDetails,
  searchParentByEmail,
  linkExistingParent,
} = require('../controllers/parentController');

router.use(protect);

router.post('/', restrictTo('super_admin', 'branch_admin', 'front_desk'), validate(createParentSchema), createParent);
router.get('/me/children', restrictTo('parent'), getMyChildren);
router.get('/me/children/:studentId/summary', restrictTo('parent'), getChildSummary);
router.get('/me/children/:studentId/fees', restrictTo('parent'), getChildFeeDetails);
router.get('/search', restrictTo('super_admin', 'branch_admin', 'front_desk'), validate(searchParentSchema, 'query'), searchParentByEmail);
router.put('/link', restrictTo('super_admin', 'branch_admin', 'front_desk'), validate(linkParentSchema), linkExistingParent);

module.exports = router;