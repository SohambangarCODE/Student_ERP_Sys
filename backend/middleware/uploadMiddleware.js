const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure the uploads folder exists — multer won't create it automatically
const uploadDir = path.join(__dirname, '..', 'uploads', 'logos');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    // Prefix with instituteId + timestamp so files never collide across institutes or re-uploads
    const ext = path.extname(file.originalname);
    cb(null, `${req.user.instituteId}_${Date.now()}${ext}`);
  },
});

// Only allow actual image files, and cap size to keep this sane
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  },
});

module.exports = upload;