const express = require('express');
const router = express.Router();
const { registerInstitute, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { authIpLimiter } = require('../middleware/rateLimiter');
const validate = require('../middleware/validate');
const { loginSchema, registerInstituteSchema } = require('../validations/auth.validation');

// Auth routes get the strictest limiter (per-IP) + Joi schema validation.
// The account-level exponential backoff is applied inside authController.login itself
// because it needs access to the email value after validation runs.
router.post('/register-institute', authIpLimiter, validate(registerInstituteSchema), registerInstitute);
router.post('/login', authIpLimiter, validate(loginSchema), login);
router.get('/me', protect, getMe);

module.exports = router;