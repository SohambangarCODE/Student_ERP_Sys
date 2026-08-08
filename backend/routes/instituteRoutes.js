const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getMyInstitute } = require('../controllers/instituteController');

router.use(protect);
router.get('/me', getMyInstitute);

module.exports = router;