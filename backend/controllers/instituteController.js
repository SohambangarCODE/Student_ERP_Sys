const Institute = require('../models/Institute');

// GET /api/institutes/me
exports.getMyInstitute = async (req, res, next) => {
  try {
    const institute = await Institute.findById(req.user.instituteId);
    if (!institute) {
      return res.status(404).json({ message: 'Institute not found' });
    }
    res.json(institute);
  } catch (err) {
    next(err);
  }
};


// PUT /api/institutes/me — update basic institute details (name, address, contact)
exports.updateMyInstitute = async (req, res, next) => {
  try {
    const { name, address, contactPhone, contactEmail } = req.body;
    const institute = await Institute.findByIdAndUpdate(
      req.user.instituteId,
      { name, address, contactPhone, contactEmail },
      { new: true, runValidators: true }
    );
    res.json(institute);
  } catch (err) {
    next(err);
  }
};

// POST /api/institutes/me/logo — upload/replace the institute's logo
exports.uploadLogo = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Store a URL path, not a raw filesystem path — the frontend needs something it can put directly in an <img src>
    const logoUrl = `/uploads/logos/${req.file.filename}`;

    const institute = await Institute.findByIdAndUpdate(
      req.user.instituteId,
      { logoUrl },
      { new: true }
    );

    res.json(institute);
  } catch (err) {
    next(err);
  }
};