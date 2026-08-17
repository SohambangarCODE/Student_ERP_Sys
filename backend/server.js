const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");

require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const app = express();

// ── Security: limit the CORS origin to your actual frontend URL in production ──
// For local dev, the default open CORS is fine. For prod, set CORS_ORIGIN in .env.
app.use(cors(
  process.env.CORS_ORIGIN
    ? { origin: process.env.CORS_ORIGIN, credentials: true }
    : {}
));

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, "../public")));

// API middleware
app.use(express.json());

// ── Rate limiting ──────────────────────────────────────────────────────────────
// Apply the general API limiter globally to /api/*.
// Auth routes get the stricter authIpLimiter applied directly in authRoutes.js
// (so the tighter limit overlaps on top of this one there).
const { apiLimiter } = require("./middleware/rateLimiter");
app.use("/api/", apiLimiter);

// ── Static file serving (uploads) ─────────────────────────────────────────────
// Narrowly scoped to /uploads — only this path serves files from disk.
// The directory is configured by multer to store images with non-executable extensions,
// so files here can never be run as scripts. We also disable directory listing.
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  index: false,  // no directory listing
  dotfiles: 'deny',
}));

// ── Routes ─────────────────────────────────────────────────────────────────────
const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);

const studentRoutes = require("./routes/studentRoutes");
app.use("/api/students", studentRoutes);

const batchRoutes = require("./routes/batchRoutes");
app.use("/api/batches", batchRoutes);

const feeRoutes = require("./routes/feeRoutes");
app.use("/api/fees", feeRoutes);

const attendanceRoutes = require('./routes/attendanceRoutes');
app.use('/api/attendance', attendanceRoutes);

const examRoutes = require('./routes/examRoutes');
app.use('/api/exams', examRoutes);

const staffRoutes = require('./routes/staffRoutes');
app.use('/api/staff', staffRoutes);

const noticeRoutes = require('./routes/noticeRoutes');
app.use('/api/notices', noticeRoutes);

const dashboardRoutes = require('./routes/dashboardRoutes');
app.use('/api/dashboard', dashboardRoutes);

const parentRoutes = require('./routes/parentRoutes');
app.use('/api/parents', parentRoutes);

const instituteRoutes = require('./routes/instituteRoutes');
app.use('/api/institutes', instituteRoutes);

const messageRoutes = require('./routes/messageRoutes');
app.use('/api/messages', messageRoutes);

const searchRoutes = require('./routes/searchRoutes');
app.use('/api/search', searchRoutes);

const userRoutes = require('./routes/userRoutes');
app.use('/api/users', userRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({ 
    success: true,
    message: "Server is healthy",
    timestamp: new Date().toISOString(),
   });    
});

// ── Global error handler ───────────────────────────────────────────────────────
// Must be registered LAST — after all routes.
// Catches any error passed via next(err) from a controller or middleware.
// Logs the full details server-side; returns a safe, generic message to the client.
const errorMiddleware = require('./middleware/errorMiddleware');
app.use(errorMiddleware);

// ── Database ───────────────────────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err.message));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));