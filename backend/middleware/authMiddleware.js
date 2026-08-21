const jwt = require('jsonwebtoken');

// Verifies the JWT and attaches decoded info to req.user.
// Token is read from the HttpOnly cookie set at login — never from JS-accessible storage.
exports.protect = (req, res, next) => {
  // Read token from the HttpOnly cookie (primary) or Authorization header (fallback for
  // Postman / API clients that don't use cookies during development/testing).
  const token = req.cookies?.token || (
    req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.split(' ')[1]
      : null
  );

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, instituteId, role }
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Restricts a route to specific roles — usage: restrictTo('super_admin', 'branch_admin')
exports.restrictTo = (...allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You do not have permission for this action' });
    }
    next();
  };
};