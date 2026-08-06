const express = require('express');
const router = express.Router();
const { registerInstitute, login } = require('../controllers/authController');

router.post('/register-institute', registerInstitute);
router.post('/login', login);

module.exports = router;