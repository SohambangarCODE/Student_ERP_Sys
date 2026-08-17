/**
 * errorMiddleware.js
 *
 * Global error-handling middleware — must be registered LAST (after all routes) in server.js.
 * Express identifies it as an error handler because it takes exactly 4 arguments: (err, req, res, next).
 *
 * Responsibilities:
 *  - Log full error details (stack trace, message, status) server-side for debugging.
 *  - NEVER expose stack traces, internal file paths, or raw DB error messages to the client.
 *  - Return a consistent, safe JSON error shape to every caller.
 *  - Map known Mongoose/JWT/Multer error codes to meaningful HTTP status codes.
 */

// eslint-disable-next-line no-unused-vars
const errorMiddleware = (err, req, res, next) => {
  // Always log the FULL error server-side so we can debug without leaking anything to clients.
  console.error('[ERROR]', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  // --- Map known error types to appropriate HTTP status codes ---

  // Mongoose validation error (schema-level)
  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: 'Invalid data provided.' });
  }

  // Mongoose duplicate key (unique index violation)
  if (err.code === 11000) {
    return res.status(409).json({ message: 'A record with that value already exists.' });
  }

  // Mongoose bad ObjectId (e.g. malformed :id param)
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    return res.status(400).json({ message: 'Invalid identifier format.' });
  }

  // JWT errors (expired, malformed, wrong signature)
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Authentication failed. Please log in again.' });
  }

  // Multer file errors (size / type)
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ message: 'Uploaded file is too large.' });
  }
  if (err.message === 'Only image files are allowed' || err.message === 'Invalid file type') {
    return res.status(415).json({ message: 'Unsupported file type.' });
  }

  // Rate-limiter-flexible block (passed via next(err) from auth controller)
  if (err.msBeforeNext !== undefined) {
    const retryAfterSeconds = Math.ceil(err.msBeforeNext / 1000);
    return res
      .status(429)
      .set('Retry-After', retryAfterSeconds)
      .json({
        message: `Too many failed attempts. Please try again in ${retryAfterSeconds} seconds.`,
      });
  }

  // HTTP errors explicitly set by route handlers via: const e = new Error('...'); e.status = 400; next(e);
  if (err.status && err.status < 500) {
    return res.status(err.status).json({ message: err.message });
  }

  // Everything else → generic 500. Log was already captured above.
  return res.status(500).json({ message: 'An unexpected error occurred. Please try again later.' });
};

module.exports = errorMiddleware;
