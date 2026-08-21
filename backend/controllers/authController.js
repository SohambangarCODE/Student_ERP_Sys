const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Institute = require('../models/Institute');
const User = require('../models/User');
const { consumeAccountAttempt, rewardSuccess } = require('../middleware/rateLimiter');

// ── Cookie configuration ───────────────────────────────────────────────────────
// Centralised so login and registerInstitute always set identical attributes.
const COOKIE_NAME = 'token';
const cookieOptions = () => ({
  httpOnly: true,                                            // JS cannot read this cookie
  secure: process.env.NODE_ENV === 'production',             // HTTPS only in prod
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // cross-site in prod SPA
  maxAge: 7 * 24 * 60 * 60 * 1000,                          // 7 days — matches JWT expiry
});

// POST /api/auth/register-institute
// Used ONCE per institute — creates the institute AND its first super_admin user
exports.registerInstitute = async (req, res, next) => {
  try {
    // Joi validation (validate middleware) already ran — req.body is safe and type-checked
    const { instituteName, adminName, email, password } = req.body;

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

    // Set the JWT as an HttpOnly cookie — JS cannot read this
    res.cookie(COOKIE_NAME, token, cookieOptions());

    res.status(201).json({
      user: { id: user._id, name: user.name, role: user.role, instituteId: institute._id },
    });
  } catch (err) {
    // Duplicate email within same institute hits our unique index — Mongo error code 11000
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Email already in use' });
    }
    next(err); // pass to global error handler — never expose err.message to client
  }
};

// POST /api/auth/login
exports.login = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    // ── Account-level backoff check ────────────────────────────────────────────
    // Check if this account is currently blocked BEFORE touching the DB,
    // so we don't even do the DB lookup during a brute-force flood.
    const { consumeAccountAttempt, rewardSuccess, getAccountLimiterStatus } = require('../middleware/rateLimiter');
    const status = await getAccountLimiterStatus(email);
    if (status !== null && status.consumedPoints >= parseInt(process.env.AUTH_ACCOUNT_LIMIT_MAX || 5)) {
      const msBeforeNext = status.msBeforeNext;
      const retryAfterSeconds = Math.ceil(msBeforeNext / 1000);
      return res
        .status(429)
        .set('Retry-After', retryAfterSeconds)
        .json({
          message: `Too many failed login attempts. Please try again in ${retryAfterSeconds} seconds.`,
        });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Consume a point even for unknown emails — prevents account enumeration via
      // "unknown email gets no backoff, known email does" timing difference
      await consumeAccountAttempt(email).catch(() => {});
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      // Consume a point and let the backoff accumulate
      try {
        await consumeAccountAttempt(email);
      } catch (rlErr) {
        // rlErr here means the account just hit its limit — pass the full error
        // to the global handler which will format the Retry-After response
        if (rlErr.msBeforeNext !== undefined) {
          return next(rlErr);
        }
      }
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is deactivated' });
    }

    // Successful login — reset this account's failure counter
    await rewardSuccess(email).catch(() => {});

    const token = generateToken(user);

    // Set the JWT as an HttpOnly cookie — never returned in the JSON body
    res.cookie(COOKIE_NAME, token, cookieOptions());

    res.json({
      user: { id: user._id, name: user.name, role: user.role, instituteId: user.instituteId },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me
// Called on app load to verify the stored JWT (in HttpOnly cookie) is still valid.
// Returns the user payload so the frontend can restore session safely.
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'User not found or deactivated' });
    }
    res.json({
      user: { id: user._id, name: user.name, role: user.role, instituteId: user.instituteId },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/logout
// Clears the HttpOnly cookie so the browser no longer sends the JWT.
exports.logout = (req, res) => {
  res.clearCookie(COOKIE_NAME, cookieOptions());
  res.json({ message: 'Logged out successfully' });
};

function generateToken(user) {
  return jwt.sign(
    {
      id: user._id,
      instituteId: user.instituteId,
      role: user.role,
      children: user.children || [],
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}