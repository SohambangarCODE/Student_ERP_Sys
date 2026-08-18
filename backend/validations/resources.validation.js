/**
 * notice.validation.js
 * batch.validation.js
 * notice.validation.js
 * fee.validation.js
 * exam.validation.js
 * message.validation.js
 * institute.validation.js
 *
 * Joi schemas for remaining resource endpoints.
 * Consolidated into one file to keep the validations folder tidy.
 */

const Joi = require('joi');

const OBJECT_ID = Joi.string().hex().length(24);

// ── Notice ─────────────────────────────────────────────────────────────────────
const createNoticeSchema = Joi.object({
  title: Joi.string().trim().min(2).max(200).required(),
  content: Joi.string().trim().min(1).max(5000).required(),
  batchId: OBJECT_ID.optional().allow(null, ''), // null = institute-wide
});

// ── Batch ──────────────────────────────────────────────────────────────────────
const scheduleSlotSchema = Joi.object({
  day: Joi.string().trim().max(10).optional().allow(''),
  startTime: Joi.string().trim().max(10).optional().allow(''),
  endTime: Joi.string().trim().max(10).optional().allow(''),
});

const createBatchSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required(),
  subject: Joi.string().trim().max(100).optional().allow(''),
  description: Joi.string().trim().max(500).optional().allow(''),
  teacherId: OBJECT_ID.optional().allow(null, ''),
  schedule: Joi.array().items(scheduleSlotSchema).optional(),
});

const updateBatchSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).optional(),
  subject: Joi.string().trim().max(100).optional().allow(''),
  description: Joi.string().trim().max(500).optional().allow(''),
  teacherId: OBJECT_ID.optional().allow(null, ''),
  schedule: Joi.array().items(scheduleSlotSchema).optional(),
}).min(1);

// ── Fee ────────────────────────────────────────────────────────────────────────
const createFeeStructureSchema = Joi.object({
  batchId: OBJECT_ID.required(),
  totalAmount: Joi.number().positive().max(10_000_000).required(), // max 1 crore sanity cap
  installments: Joi.array()
    .items(
      Joi.object({
        label: Joi.string().trim().max(100).required(),
        dueDate: Joi.string().isoDate().required(),
        amount: Joi.number().positive().required(),
      })
    )
    .optional(),
});

const updateFeeStructureSchema = Joi.object({
  batchId: OBJECT_ID.optional(),
  totalAmount: Joi.number().positive().max(10_000_000).optional(),
  installments: Joi.array()
    .items(
      Joi.object({
        label: Joi.string().trim().max(100).required(),
        dueDate: Joi.string().isoDate().required(),
        amount: Joi.number().positive().required(),
      })
    )
    .optional(),
}).min(1);

const recordPaymentSchema = Joi.object({
  studentId: OBJECT_ID.required(),
  feeStructureId: OBJECT_ID.required(),
  amountPaid: Joi.number().positive().max(10_000_000).required(),
  paymentMethod: Joi.string().valid('cash', 'upi', 'bank_transfer', 'razorpay', 'cheque', 'other').required(),
  transactionRef: Joi.string().trim().max(100).optional().allow('', null),
});

const createRazorpayOrderSchema = Joi.object({
  amount: Joi.number().positive().max(10_000_000).required(), // rupees
});

const verifyRazorpaySchema = Joi.object({
  razorpay_order_id: Joi.string().trim().max(100).required(),
  razorpay_payment_id: Joi.string().trim().max(100).required(),
  razorpay_signature: Joi.string().trim().max(256).required(),
  studentId: OBJECT_ID.required(),
  feeStructureId: OBJECT_ID.required(),
  amountPaid: Joi.number().positive().max(10_000_000).required(),
});

// ── Exam ───────────────────────────────────────────────────────────────────────
const createExamSchema = Joi.object({
  name: Joi.string().trim().min(2).max(150).required(),
  batchId: OBJECT_ID.required(),
  examDate: Joi.string().isoDate().required(),
  subjects: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().trim().max(100).required(),
        maxMarks: Joi.number().positive().max(1000).required(),
      })
    )
    .min(1)
    .required(),
});

const enterMarksSchema = Joi.object({
  studentId: OBJECT_ID.required(),
  marks: Joi.array()
    .items(
      Joi.object({
        subjectName: Joi.string().trim().max(100).required(),
        marksObtained: Joi.number().min(0).max(1000).required(),
      })
    )
    .min(1)
    .required(),
});

// ── Message ────────────────────────────────────────────────────────────────────
const sendMessageSchema = Joi.object({
  studentId: OBJECT_ID.required(),
  content: Joi.string().trim().min(1).max(2000).required(),
  staffId: OBJECT_ID.optional(),   // required for parent senders, optional for staff
  parentId: OBJECT_ID.optional(),  // required for staff senders, optional for parents
});

// ── Institute ──────────────────────────────────────────────────────────────────
const updateInstituteSchema = Joi.object({
  name: Joi.string().trim().min(2).max(150).optional(),
  address: Joi.string().trim().max(400).optional().allow(''),
  contactPhone: Joi.string().trim().max(15).optional().allow(''),
  contactEmail: Joi.string().email({ tlds: { allow: false } }).max(254).optional().allow(''),
}).min(1);

// ── Attendance ─────────────────────────────────────────────────────────────────
const markBulkAttendanceSchema = Joi.object({
  batchId: OBJECT_ID.required(),
  date: Joi.string().isoDate().required(),
  records: Joi.array()
    .items(
      Joi.object({
        studentId: OBJECT_ID.required(),
        status: Joi.string().valid('present', 'absent', 'late').required(),
      })
    )
    .min(1)
    .required(),
});

module.exports = {
  createNoticeSchema,
  createBatchSchema,
  updateBatchSchema,
  createFeeStructureSchema,
  updateFeeStructureSchema,
  recordPaymentSchema,
  createRazorpayOrderSchema,
  verifyRazorpaySchema,
  createExamSchema,
  enterMarksSchema,
  sendMessageSchema,
  updateInstituteSchema,
  markBulkAttendanceSchema,
};
