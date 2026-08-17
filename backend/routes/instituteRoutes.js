const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { updateInstituteSchema } = require('../validations/resources.validation');
const upload = require('../middleware/uploadMiddleware');
const { getMyInstitute, updateMyInstitute, uploadLogo } = require('../controllers/instituteController');

router.use(protect);
router.get('/me', getMyInstitute);
router.put('/me', restrictTo('super_admin', 'branch_admin'), validate(updateInstituteSchema), updateMyInstitute);
router.post('/me/logo', restrictTo('super_admin', 'branch_admin'), upload.single('logo'), uploadLogo);

module.exports = router;