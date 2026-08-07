const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");

require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

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

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "ERP backend is alive" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
