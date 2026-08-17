const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { sendMessageSchema } = require('../validations/resources.validation');
const { sendMessage, getThread, getAllThreads, getAvailableContacts } = require('../controllers/messageController');

router.use(protect);

router.post('/', validate(sendMessageSchema), sendMessage); // both parents and staff can send
router.get('/thread/:studentId', getThread);
router.get('/threads', restrictTo('super_admin', 'branch_admin', 'teacher'), getAllThreads);
router.get('/contacts/:studentId', restrictTo('parent'), getAvailableContacts);

module.exports = router;