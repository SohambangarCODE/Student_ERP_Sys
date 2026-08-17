const Student = require('../models/Student');
const Batch = require('../models/Batch');

// GET /api/search?q=...
exports.search = async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.json({ students: [], batches: [] }); // avoid querying on empty/1-char input — wasteful and noisy
    }

    // Case-insensitive partial match — $regex with 'i' flag, escaped so special characters
    // in the search text (like "(" or "+") don't break the regex or crash the query.
    const safeQuery = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(safeQuery, 'i');

    const [students, batches] = await Promise.all([
      Student.find({
        instituteId: req.user.instituteId,
        $or: [{ name: regex }, { admissionNumber: regex }],
      }).select('name admissionNumber batchId').limit(8).populate('batchId', 'name'),

      Batch.find({
        instituteId: req.user.instituteId,
        name: regex,
      }).select('name').limit(5),
    ]);

    res.json({ students, batches });
  } catch (err) {
    next(err);
  }
};