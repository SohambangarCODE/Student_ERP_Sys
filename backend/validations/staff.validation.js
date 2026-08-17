/**
 * staff.validation.js
 *
 * Joi schemas for staff-related endpoints.
 */

const Joi = require('joi');

const STAFF_ROLES = ['branch_admin', 'accountant', 'teacher', 'front_desk'];
const PHONE_PATTERN = /^[6-9]\d{9}$/;

// POST /api/staff
const createStaffSchema = Joi.object({
  name: Joi.string().trim().min(2).max(80).required(),
  email: Joi.string().email({ tlds: { allow: false } }).max(254).lowercase().trim().required(),
  password: Joi.string().min(8).max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'must contain uppercase, lowercase and number')
    .required()
    .messages({
      'string.pattern.name': 'Password must contain at least one uppercase letter, one lowercase letter, and one number.',
    }),
  role: Joi.string().valid(...STAFF_ROLES).required(),
  phone: Joi.string().pattern(PHONE_PATTERN).optional().allow('').messages({
    'string.pattern.base': 'Phone must be a valid 10-digit Indian mobile number.',
  }),
});

// PUT /api/staff/:id
const updateStaffSchema = Joi.object({
  name: Joi.string().trim().min(2).max(80).optional(),
  phone: Joi.string().pattern(PHONE_PATTERN).optional().allow(''),
  role: Joi.string().valid(...STAFF_ROLES).optional(),
  isActive: Joi.boolean().optional(),
}).min(1);

module.exports = { createStaffSchema, updateStaffSchema };
