const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const { search } = require('../controllers/searchController');

router.use(protect);
router.get('/', restrictTo('super_admin', 'branch_admin', 'accountant', 'teacher', 'front_desk'), search);

module.exports = router;