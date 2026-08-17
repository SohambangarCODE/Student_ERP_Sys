/**
 * uploadMiddleware.js
 *
 * Security hardening:
 * 1. MIME type check — only allow actual image MIME types (not just extension).
 * 2. Strict extension allowlist — reject anything not in ALLOWED_EXTS.
 * 3. File-type magic-byte check is done as a separate step in the controller
 *    (file-type@16 is CJS compatible; imported there to avoid complexity here).
 * 4. 2 MB cap — unchanged.
 * 5. Files stored in uploads/logos/ which is outside the webroot's served scope
 *    only because Express.static is explicitly and narrowly scoped to /uploads.
 *    Uploaded files are never given executable extensions, so they cannot be run as code.
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure the uploads folder exists — multer won't create it automatically
const uploadDir = path.join(__dirname, '..', 'uploads', 'logos');
fs.mkdirSync(uploadDir, { recursive: true });

// Strict allowlist — only these extensions are accepted
const ALLOWED_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    // Sanitize: extract only the extension from the original name, then build a
    // clean filename using instituteId + timestamp. The original filename is never used.
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${req.user.instituteId}_${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB hard cap
  fileFilter: (req, file, cb) => {
    // Check 1: MIME type must be an image type
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }

    // Check 2: extension must be in our allowlist
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTS.has(ext)) {
      return cb(new Error('Invalid file type'));
    }

    cb(null, true);
  },
});

module.exports = upload;