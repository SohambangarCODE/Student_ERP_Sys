const Institute = require('../models/Institute');

// GET /api/institutes/me
exports.getMyInstitute = async (req, res) => {
  try {
    const institute = await Institute.findById(req.user.instituteId);
    if (!institute) {
      return res.status(404).json({ message: 'Institute not found' });
    }
    res.json(institute);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};