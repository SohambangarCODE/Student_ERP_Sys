const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const { sendMessage, getThread, getAllThreads } = require('../controllers/messageController');

router.use(protect);

router.post('/', sendMessage); // both parents and staff can send
router.get('/thread/:studentId', getThread);
router.get('/threads', restrictTo('super_admin', 'branch_admin', 'teacher'), getAllThreads);

module.exports = router;