const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Institute = require('../models/Institute');
const User = require('../models/User');

// POST /api/auth/register-institute
// Used ONCE per institute — creates the institute AND its first super_admin user
exports.registerInstitute = async (req, res) => {
  try {
    const { instituteName, adminName, email, password } = req.body;

    if (!instituteName || !adminName || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Create the tenant first
    const institute = await Institute.create({ name: instituteName });

    // Hash password BEFORE saving — never store plain text
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      instituteId: institute._id,
      name: adminName,
      email,
      password: hashedPassword,
      role: 'super_admin',
    });

    const token = generateToken(user);

    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, role: user.role, instituteId: institute._id },
    });
  } catch (err) {
    // Duplicate email within same institute hits our unique index — Mongo error code 11000
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Email already in use' });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is deactivated' });
    }

    const token = generateToken(user);

    res.json({
      token,
      user: { id: user._id, name: user.name, role: user.role, instituteId: user.instituteId },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

function generateToken(user) {
  return jwt.sign(
    {
      id: user._id,
      instituteId: user.instituteId,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}