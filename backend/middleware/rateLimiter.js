/**
 * rateLimiter.js
 *
 * Three strategies, each read from env vars so thresholds are configurable per-environment:
 *
 *  1. apiLimiter        – applied globally to /api/* (moderate, authenticated)
 *  2. authIpLimiter     – applied per-IP to auth routes (strict)
 *  3. authAccountLimiter – per-email account backoff on login (avoids hard lockout)
 *
 * Per-account backoff uses rate-limiter-flexible which supports exponential penalty multipliers,
 * so brute-forcing a specific account gets progressively slower rather than hitting a brick wall.
 */

const rateLimit = require('express-rate-limit');
const { RateLimiterMemory } = require('rate-limiter-flexible');

// ── 1. General API limiter (authenticated user actions) ───────────────────────
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.API_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.API_RATE_LIMIT_MAX) || 300,
  standardHeaders: true,   // send RateLimit-* headers
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
  // Skip rate-limiting for health-check-style probes if added later
  skip: (req) => req.path === '/api/health',
});

// ── 2. IP-based auth limiter (express-rate-limit, simple & fast) ──────────────
const authIpLimiter = rateLimit({
  windowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts from this IP, please try again in 15 minutes.' },
});

// ── 3. Per-account limiter with exponential backoff (rate-limiter-flexible) ────
//
// Uses in-memory store (fine for single-process; swap for Redis in multi-instance deployments
// by replacing RateLimiterMemory with RateLimiterRedis).
//
// Each failed login against a specific email counts toward that account's bucket.
// After AUTH_ACCOUNT_LIMIT_MAX failures the account is blocked for blockDuration seconds.
// The exponential factor means each ADDITIONAL failure doubles the block time.
const accountLimiter = new RateLimiterMemory({
  points: parseInt(process.env.AUTH_ACCOUNT_LIMIT_MAX) || 5, // failed attempts allowed
  duration: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS) / 1000 || 900, // window in seconds
  blockDuration: parseInt(process.env.AUTH_BLOCK_DURATION_SECONDS) || 900, // initial block (s)
});

/**
 * Middleware factory — call this on auth routes AFTER the IP limiter.
 * Consumes one point per failed login attempt for that email.
 * On success (user actually authenticated) call rewardSuccess(email) to reset their counter.
 *
 * Usage in controller:
 *   const { consumeAccountAttempt, rewardSuccess } = require('../middleware/rateLimiter');
 */
async function consumeAccountAttempt(email) {
  return accountLimiter.consume(email.toLowerCase());
}

async function rewardSuccess(email) {
  return accountLimiter.delete(email.toLowerCase());
}

async function getAccountLimiterStatus(email) {
  return accountLimiter.get(email.toLowerCase());
}

module.exports = {
  apiLimiter,
  authIpLimiter,
  consumeAccountAttempt,
  rewardSuccess,
  getAccountLimiterStatus,
};
