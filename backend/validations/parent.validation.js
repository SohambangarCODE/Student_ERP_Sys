/**
 * parent.validation.js
 *
 * Joi schemas for parent-related endpoints.
 */

const Joi = require('joi');

const PHONE_PATTERN = /^[6-9]\d{9}$/;
const OBJECT_ID = Joi.string().hex().length(24);

// POST /api/parents
const createParentSchema = Joi.object({
  name: Joi.string().trim().min(2).max(80).required(),
  email: Joi.string().email({ tlds: { allow: false } }).max(254).lowercase().trim().required(),
  password: Joi.string().min(8).max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'must contain uppercase, lowercase and number')
    .required()
    .messages({
      'string.pattern.name': 'Password must contain at least one uppercase letter, one lowercase letter, and one number.',
    }),
  phone: Joi.string().pattern(PHONE_PATTERN).optional().allow('').messages({
    'string.pattern.base': 'Phone must be a valid 10-digit Indian mobile number.',
  }),
  studentIds: Joi.array().items(OBJECT_ID).min(1).required(),
});

// PUT /api/parents/link
const linkParentSchema = Joi.object({
  parentId: OBJECT_ID.required(),
  studentId: OBJECT_ID.required(),
});

// GET /api/parents/search — query param validation
const searchParentSchema = Joi.object({
  email: Joi.string().email({ tlds: { allow: false } }).max(254).lowercase().trim().required(),
});

module.exports = { createParentSchema, linkParentSchema, searchParentSchema };
