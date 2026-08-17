const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { updateMeSchema, changePasswordSchema } = require('../validations/user.validation');
const { getMe, updateMe, changePassword } = require('../controllers/userController');

router.use(protect); // every logged-in role can reach these

router.get('/me', getMe);
router.put('/me', validate(updateMeSchema), updateMe);
router.put('/me/password', validate(changePasswordSchema), changePassword);

module.exports = router;