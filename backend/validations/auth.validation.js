/**
 * auth.validation.js
 *
 * Joi schemas for authentication endpoints.
 * Strict — rejects any field not listed here.
 */

const Joi = require('joi');

// POST /api/auth/login
const loginSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } }) // validate format; tlds:false avoids fetching TLD list
    .max(254)                          // RFC 5321 max email length
    .lowercase()
    .trim()
    .required(),
  password: Joi.string()
    .min(6)
    .max(128)
    .required(),
});

// POST /api/auth/register-institute
const registerInstituteSchema = Joi.object({
  instituteName: Joi.string().trim().min(2).max(120).required(),
  adminName: Joi.string().trim().min(2).max(80).required(),
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .max(254)
    .lowercase()
    .trim()
    .required(),
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'must contain uppercase, lowercase and number')
    .required()
    .messages({
      'string.pattern.name': 'Password must contain at least one uppercase letter, one lowercase letter, and one number.',
    }),
});

module.exports = { loginSchema, registerInstituteSchema };
