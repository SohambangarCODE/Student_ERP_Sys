const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const { createNotice, getNotices, deleteNotice } = require('../controllers/noticeController');

router.use(protect);

router.post('/', restrictTo('super_admin', 'branch_admin', 'teacher'), createNotice);
router.get('/', getNotices); // anyone logged in can view
router.delete('/:id', restrictTo('super_admin', 'branch_admin'), deleteNotice);

module.exports = router;