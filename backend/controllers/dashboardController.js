const mongoose = require('mongoose');
const Student = require('../models/Student');
const Batch = require('../models/Batch');
const User = require('../models/User');
const FeeStructure = require('../models/FeeStructure');
const FeePayment = require('../models/FeePayment');
const Attendance = require('../models/Attendance');
const Notice = require('../models/Notice');

exports.getDashboardStats = async (req, res) => {
  try {
    const instituteId = new mongoose.Types.ObjectId(req.user.instituteId);
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);

    // Run everything independent of each other in parallel — none of these queries
    // depend on another's result, so there's no reason to wait for one before starting the next.
    const [
      totalStudents,
      totalBatches,
      totalStaff,
      feeTotals,
      collectionTrend,
      todayAttendance,
      recentNotices,
    ] = await Promise.all([
      Student.countDocuments({ instituteId, status: 'active' }),
      Batch.countDocuments({ instituteId }),
      User.countDocuments({ instituteId, role: { $in: ['branch_admin', 'accountant', 'teacher', 'front_desk'] }, isActive: true }),

      // Total owed vs total collected, institute-wide
      FeeStructure.aggregate([
        { $match: { instituteId } },
        { $group: { _id: null, totalOwed: { $sum: '$totalAmount' } } },
      ]).then(async (owedResult) => {
        const totalOwed = owedResult[0]?.totalOwed || 0;
        const paidResult = await FeePayment.aggregate([
          { $match: { instituteId } },
          { $group: { _id: null, totalCollected: { $sum: '$amountPaid' } } },
        ]);
        const totalCollected = paidResult[0]?.totalCollected || 0;
        return { totalOwed, totalCollected, totalPending: totalOwed - totalCollected };
      }),

      // Last 6 months of fee collection, grouped by month — powers the bar chart
      FeePayment.aggregate([
        { $match: { instituteId } },
        {
          $group: {
            _id: { year: { $year: '$paymentDate' }, month: { $month: '$paymentDate' } },
            total: { $sum: '$amountPaid' },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        { $limit: 6 },
      ]),

      // Today's attendance breakdown — powers the donut chart
      Attendance.aggregate([
        { $match: { instituteId, date: { $gte: todayStart, $lte: todayEnd } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),

      Notice.find({ instituteId }).sort({ createdAt: -1 }).limit(5).populate('createdBy', 'name'),
    ]);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const trend = collectionTrend.map((t) => ({
      month: monthNames[t._id.month - 1],
      total: t.total,
    }));

    const attendanceCounts = { present: 0, absent: 0, late: 0 };
    todayAttendance.forEach((a) => { attendanceCounts[a._id] = a.count; });

    res.json({
      totalStudents,
      totalBatches,
      totalStaff,
      fees: feeTotals,
      collectionTrend: trend,
      todayAttendance: attendanceCounts,
      recentNotices,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};