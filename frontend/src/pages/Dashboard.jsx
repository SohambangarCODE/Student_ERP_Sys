import { useState, useEffect, useRef } from "react";
import { Users, BookOpen, UserCog, Wallet, Megaphone } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import DashboardLayout from "../components/DashboardLayout";
import { getDashboardStats } from "../api/dashboardApi";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { search } from "../api/searchApi";

function StatCard({ icon: Icon, label, value, tint }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{label}</p>
        <div
          className={`h-8 w-8 rounded-lg flex items-center justify-center ${tint}`}
        >
          <Icon size={16} />
        </div>
      </div>
      <p className="text-2xl font-semibold text-slate-900 mt-2">{value}</p>
    </div>
  );
}

const ATTENDANCE_COLORS = {
  present: "#16a34a",
  absent: "#dc2626",
  late: "#d97706",
};

function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const canSeeFees = [
    "super_admin",
    "branch_admin",
    "accountant",
    "front_desk",
  ].includes(user?.role);
  const canSeeStaffCount = ["super_admin", "branch_admin"].includes(user?.role);
  const canSeeAttendanceChart = [
    "super_admin",
    "branch_admin",
    "teacher",
  ].includes(user?.role);

  useEffect(() => {
    getDashboardStats()
      .then((res) => setStats(res.data))
      .catch((err) => console.error("Failed to load dashboard stats:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <p className="text-sm text-slate-500">Loading dashboard...</p>
      </DashboardLayout>
    );
  }

  if (!stats) {
    return (
      <DashboardLayout>
        <p className="text-sm text-red-600">
          Failed to load dashboard data. Please refresh.
        </p>
      </DashboardLayout>
    );
  }

  const attendancePieData = Object.entries(stats.todayAttendance)
    .filter(([, count]) => count > 0)
    .map(([status, count]) => ({ name: status, value: count }));

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-semibold text-slate-900">
        Welcome back, {user?.name?.split(" ")[0]}
      </h1>
      <p className="text-sm text-slate-500 mt-1">
        Here's what's happening at your institute today.
      </p>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <StatCard
          icon={Users}
          label="Total Students"
          value={stats.totalStudents}
          tint="bg-brand-50 text-brand-600"
        />
        <StatCard
          icon={BookOpen}
          label="Active Batches"
          value={stats.totalBatches}
          tint="bg-blue-50 text-blue-600"
        />
        {canSeeStaffCount && (
          <StatCard
            icon={UserCog}
            label="Staff Members"
            value={stats.totalStaff}
            tint="bg-purple-50 text-purple-600"
          />
        )}
        {canSeeFees && stats.fees && (
          <StatCard
            icon={Wallet}
            label="Fees Pending"
            value={`₹${stats.fees.totalPending.toLocaleString()}`}
            tint="bg-red-50 text-red-600"
          />
        )}
      </div>

      {/* Charts */}
      {(canSeeFees || canSeeAttendanceChart) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
          {canSeeFees && stats.fees && (
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">
                Fee Collection — Last 6 Months
              </h3>
              {stats.collectionTrend.length === 0 ? (
                <p className="text-sm text-slate-400 py-12 text-center">
                  No payments recorded yet
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={stats.collectionTrend}>
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 12, fill: "#64748b" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: "#64748b" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      formatter={(value) => [
                        `₹${value.toLocaleString()}`,
                        "Collected",
                      ]}
                    />
                    <Bar dataKey="total" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          )}
          {canSeeAttendanceChart && (
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">
                Today's Attendance
              </h3>
              {attendancePieData.length === 0 ? (
                <p className="text-sm text-slate-400 py-12 text-center">
                  No attendance marked today
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={attendancePieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={45}
                      outerRadius={70}
                    >
                      {attendancePieData.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={ATTENDANCE_COLORS[entry.name]}
                        />
                      ))}
                    </Pie>
                    <Legend
                      iconType="circle"
                      wrapperStyle={{
                        fontSize: 12,
                        textTransform: "capitalize",
                      }}
                    />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          )}
        </div>
      )}

      {/* Recent notices */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 mt-6">
        <div className="flex items-center gap-2 mb-4">
          <Megaphone size={16} className="text-brand-600" />
          <h3 className="text-sm font-semibold text-slate-900">
            Recent Notices
          </h3>
        </div>
        {stats.recentNotices.length === 0 ? (
          <p className="text-sm text-slate-400 py-4">No notices posted yet.</p>
        ) : (
          <div className="space-y-3">
            {stats.recentNotices.map((notice) => (
              <div
                key={notice._id}
                className="flex items-start justify-between border-b border-slate-100 last:border-0 pb-3 last:pb-0"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {notice.title}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {notice.content}
                  </p>
                </div>
                <span className="text-xs text-slate-400 whitespace-nowrap ml-4">
                  {new Date(notice.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default Dashboard;
