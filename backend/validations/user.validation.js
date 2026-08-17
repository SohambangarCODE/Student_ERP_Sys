/**
 * user.validation.js
 *
 * Joi schemas for user self-service endpoints (/api/users/me).
 */

const Joi = require('joi');

const PHONE_PATTERN = /^[6-9]\d{9}$/;

// PUT /api/users/me
const updateMeSchema = Joi.object({
  name: Joi.string().trim().min(2).max(80).optional(),
  phone: Joi.string().pattern(PHONE_PATTERN).optional().allow('').messages({
    'string.pattern.base': 'Phone must be a valid 10-digit Indian mobile number.',
  }),
}).min(1);

// PUT /api/users/me/password
const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().min(1).max(128).required(),
  newPassword: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'must contain uppercase, lowercase and number')
    .invalid(Joi.ref('currentPassword'))
    .required()
    .messages({
      'string.pattern.name': 'New password must contain at least one uppercase letter, one lowercase letter, and one number.',
      'any.invalid': 'New password must be different from the current password.',
    }),
});

module.exports = { updateMeSchema, changePasswordSchema };
