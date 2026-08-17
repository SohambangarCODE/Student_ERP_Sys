/**
 * validate.js
 *
 * Reusable validation middleware factory.
 * Usage: router.post('/route', validate(myJoiSchema), controllerFn);
 *
 * Validates the request body (or query/params) against the given Joi schema.
 * If validation fails → immediately returns 400 with the first validation error message.
 * If validation passes → calls next() so the controller runs.
 *
 * This is a REJECT approach — we never silently strip or coerce invalid input.
 * The schema is the single source of truth; anything outside it is refused.
 *
 * @param {import('joi').Schema} schema – a Joi schema object
 * @param {'body'|'query'|'params'} [source='body'] – which part of req to validate
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: true,      // stop at the first error so the message is clean
      allowUnknown: false,   // reject any key not explicitly listed in the schema
      stripUnknown: false,   // don't silently strip extra keys — fail loudly instead
      convert: false,        // never coerce types (e.g. "123" → 123) — type must match exactly
    });

    if (error) {
      // error.details[0].message is safe to expose — it describes the field/format issue
      // without leaking any server internals.
      return res.status(400).json({ message: error.details[0].message });
    }

    // Replace req[source] with the validated (type-checked) value so the controller
    // never touches raw unvalidated input.
    req[source] = value;
    next();
  };
};

module.exports = validate;
