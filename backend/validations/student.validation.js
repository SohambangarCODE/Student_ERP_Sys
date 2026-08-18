/**
 * student.validation.js
 *
 * Joi schemas for student-related endpoints.
 */

const Joi = require('joi');

const VALID_STATUSES = ['active', 'inactive', 'graduated', 'dropped'];
const PHONE_PATTERN = /^[6-9]\d{9}$/; // Indian mobile: starts 6-9, 10 digits

// POST /api/students
const createStudentSchema = Joi.object({
  name: Joi.string().trim().min(2).max(80).required(),
  admissionNumber: Joi.string().trim().min(1).max(30).required(),
  email: Joi.string().email({ tlds: { allow: false } }).max(254).lowercase().trim().optional().allow(''),
  phone: Joi.string().pattern(PHONE_PATTERN).optional().allow('').messages({
    'string.pattern.base': 'Phone must be a valid 10-digit Indian mobile number.',
  }),
  gender: Joi.string().valid('male', 'female', 'other').optional().allow(null, ''),
  batchId: Joi.string().hex().length(24).optional().allow(null, ''),  // Mongoose ObjectId
  status: Joi.string().valid(...VALID_STATUSES).default('active'),
  dateOfBirth: Joi.string().isoDate().optional().allow(null, ''),
  address: Joi.string().trim().max(300).optional().allow(null, ''),
  guardianContact: Joi.object({
    name: Joi.string().trim().max(80).optional().allow(''),
    phone: Joi.string().pattern(PHONE_PATTERN).optional().allow(''),
    relation: Joi.string().trim().max(30).optional().allow(''),
  }).optional(),
  parentIds: Joi.array().items(Joi.string().hex().length(24)).optional(),
});

// PUT /api/students/:id
const updateStudentSchema = Joi.object({
  name: Joi.string().trim().min(2).max(80).optional(),
  email: Joi.string().email({ tlds: { allow: false } }).max(254).lowercase().trim().optional().allow(''),
  phone: Joi.string().pattern(PHONE_PATTERN).optional().allow(''),
  gender: Joi.string().valid('male', 'female', 'other').optional().allow(null, ''),
  batchId: Joi.string().hex().length(24).optional().allow(null, ''),
  status: Joi.string().valid(...VALID_STATUSES).optional(),
  dateOfBirth: Joi.string().isoDate().optional().allow(null, ''),
  address: Joi.string().trim().max(300).optional().allow(null, ''),
  guardianContact: Joi.object({
    name: Joi.string().trim().max(80).optional().allow(''),
    phone: Joi.string().pattern(PHONE_PATTERN).optional().allow(''),
    relation: Joi.string().trim().max(30).optional().allow(''),
  }).optional(),
}).min(1); // at least one field must be present for an update

// PUT /api/students/:id/status
const updateStatusSchema = Joi.object({
  status: Joi.string().valid(...VALID_STATUSES).required(),
});

// PUT /api/students/:id/unlink-parent
const unlinkParentSchema = Joi.object({
  parentId: Joi.string().hex().length(24).required(),
});

module.exports = { createStudentSchema, updateStudentSchema, updateStatusSchema, unlinkParentSchema };
