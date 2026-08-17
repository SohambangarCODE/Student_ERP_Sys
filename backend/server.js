const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");

require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.use('/uploads', express.static('uploads')); // keep this here — no route dependency, just static file serving

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
app.use('/api/institutes', instituteRoutes); // now this is the ONLY mount — declared and used right next to each other

const messageRoutes = require('./routes/messageRoutes');
app.use('/api/messages', messageRoutes);

const searchRoutes = require('./routes/searchRoutes');
app.use('/api/search', searchRoutes);

const userRoutes = require('./routes/userRoutes');
app.use('/api/users', userRoutes);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// app.get("/api/health", (req, res) => {
//   res.json({ status: "ok", message: "ERP backend is alive" });
// });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));