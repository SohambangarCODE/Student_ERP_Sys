const Batch = require('../models/Batch');

// POST /api/batches
exports.createBatch = async (req, res) => {
  try {
    const batch = await Batch.create({
      ...req.body,
      instituteId: req.user.instituteId,
    });
    res.status(201).json(batch);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/batches
exports.getBatches = async (req, res) => {
  try {
    const batches = await Batch.find({ instituteId: req.user.instituteId })
      .populate('teacherId', 'name email')
      .sort({ createdAt: -1 });
    res.json(batches);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/batches/:id
exports.getBatchById = async (req, res) => {
  try {
    const batch = await Batch.findOne({
      _id: req.params.id,
      instituteId: req.user.instituteId,
    }).populate('teacherId', 'name email');

    if (!batch) {
      return res.status(404).json({ message: 'Batch not found' });
    }
    res.json(batch);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// PUT /api/batches/:id
exports.updateBatch = async (req, res) => {
  try {
    const batch = await Batch.findOneAndUpdate(
      { _id: req.params.id, instituteId: req.user.instituteId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!batch) {
      return res.status(404).json({ message: 'Batch not found' });
    }
    res.json(batch);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// DELETE /api/batches/:id
exports.deleteBatch = async (req, res) => {
  try {
    const batch = await Batch.findOneAndDelete({
      _id: req.params.id,
      instituteId: req.user.instituteId,
    });

    if (!batch) {
      return res.status(404).json({ message: 'Batch not found' });
    }
    res.json({ message: 'Batch deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};