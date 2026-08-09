const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { getMyInstitute, updateMyInstitute, uploadLogo } = require('../controllers/instituteController');

router.use(protect);
router.get('/me', getMyInstitute);
router.put('/me', restrictTo('super_admin', 'branch_admin'), updateMyInstitute);
router.post('/me/logo', restrictTo('super_admin', 'branch_admin'), upload.single('logo'), uploadLogo);

module.exports = router;