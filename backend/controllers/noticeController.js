const Notice = require('../models/Notice');

// POST /api/notices
exports.createNotice = async (req, res, next) => {
  try {
    const notice = await Notice.create({
      ...req.body,
      instituteId: req.user.instituteId,
      createdBy: req.user.id,
    });
    res.status(201).json(notice);
  } catch (err) {
    next(err);
  }
};

// GET /api/notices  (optional ?batchId= to filter to institute-wide + that batch's notices)
exports.getNotices = async (req, res, next) => {
  try {
    const filter = { instituteId: req.user.instituteId };

    if (req.query.batchId) {
      // Show both institute-wide notices (batchId: null) AND this specific batch's notices
      filter.$or = [{ batchId: null }, { batchId: req.query.batchId }];
    }

    const notices = await Notice.find(filter)
      .populate('batchId', 'name')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    res.json(notices);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/notices/:id
exports.deleteNotice = async (req, res, next) => {
  try {
    const notice = await Notice.findOneAndDelete({
      _id: req.params.id,
      instituteId: req.user.instituteId,
    });
    if (!notice) {
      return res.status(404).json({ message: 'Notice not found' });
    }
    res.json({ message: 'Notice deleted' });
  } catch (err) {
    next(err);
  }
};