const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getMe, updateMe, changePassword } = require('../controllers/userController');

router.use(protect); // every logged-in role can reach these — no restrictTo needed, since it's always "your own" data

router.get('/me', getMe);
router.put('/me', updateMe);
router.put('/me/password', changePassword);

module.exports = router;