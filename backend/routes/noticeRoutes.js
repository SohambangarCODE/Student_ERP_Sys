const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { createNoticeSchema } = require('../validations/resources.validation');
const { createNotice, getNotices, deleteNotice } = require('../controllers/noticeController');

router.use(protect);

router.post('/', restrictTo('super_admin', 'branch_admin', 'teacher'), validate(createNoticeSchema), createNotice);
router.get('/', getNotices);
router.delete('/:id', restrictTo('super_admin', 'branch_admin'), deleteNotice);

module.exports = router;