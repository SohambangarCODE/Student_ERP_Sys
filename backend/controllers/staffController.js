const bcrypt = require('bcryptjs');
const User = require('../models/User');

const STAFF_ROLES = ['branch_admin', 'accountant', 'teacher', 'front_desk'];

// POST /api/staff
exports.createStaff = async (req, res, next) => {
  try {
    const { name, email, password, role, phone } = req.body;

    if (!STAFF_ROLES.includes(role)) {
      return res.status(400).json({ message: 'Invalid role for staff creation' });
    }

    // A branch_admin cannot create another branch_admin — only super_admin can.
    // This prevents privilege escalation: a branch admin shouldn't be able to mint peers.
    if (req.user.role === 'branch_admin' && role === 'branch_admin') {
      return res.status(403).json({ message: 'Only a super admin can create a branch admin' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const staff = await User.create({
      instituteId: req.user.instituteId,
      name,
      email,
      password: hashedPassword,
      role,
      phone,
    });

    // Never send the password hash back, even hashed — no reason for the client to ever see it
    const { password: _, ...staffWithoutPassword } = staff.toObject();
    res.status(201).json(staffWithoutPassword);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Email already in use in this institute' });
    }
    next(err);
  }
};

// GET /api/staff
exports.getStaff = async (req, res, next) => {
  try {
    const staff = await User.find({
      instituteId: req.user.instituteId,
      role: { $in: STAFF_ROLES }, // exclude parents from this list — this page is staff-only
    })
      .select('-password') // exclude password hash from the response entirely
      .sort({ createdAt: -1 });

    res.json(staff);
  } catch (err) {
    next(err);
  }
};

// GET /api/staff/:id
exports.getStaffById = async (req, res, next) => {
  try {
    const staff = await User.findOne({
      _id: req.params.id,
      instituteId: req.user.instituteId,
    }).select('-password');

    if (!staff) {
      return res.status(404).json({ message: 'Staff member not found' });
    }
    res.json(staff);
  } catch (err) {
    next(err);
  }
};

// PUT /api/staff/:id
exports.updateStaff = async (req, res, next) => {
  try {
    const { name, phone, role, isActive } = req.body;

    if (role && req.user.role === 'branch_admin' && role === 'branch_admin') {
      return res.status(403).json({ message: 'Only a super admin can assign the branch admin role' });
    }

    const staff = await User.findOneAndUpdate(
      { _id: req.params.id, instituteId: req.user.instituteId },
      { name, phone, role, isActive },
      { new: true, runValidators: true }
    ).select('-password');

    if (!staff) {
      return res.status(404).json({ message: 'Staff member not found' });
    }
    res.json(staff);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/staff/:id
// We deactivate rather than hard-delete — preserves history (who marked attendance, entered marks, etc.)
exports.deactivateStaff = async (req, res, next) => {
  try {
    const staff = await User.findOneAndUpdate(
      { _id: req.params.id, instituteId: req.user.instituteId },
      { isActive: false },
      { new: true }
    ).select('-password');

    if (!staff) {
      return res.status(404).json({ message: 'Staff member not found' });
    }
    res.json({ message: 'Staff member deactivated', staff });
  } catch (err) {
    next(err);
  }
};