import { useState, useEffect } from 'react';
import { Wallet, ClipboardCheck, Megaphone, GraduationCap } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { getMyChildren, getChildSummary } from '../api/parentApi';
import { useAuth } from '../context/AuthContext';

function ParentDashboard() {
  const { user } = useAuth();
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState('');
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyChildren().then((res) => {
      setChildren(res.data);
      if (res.data.length > 0) setSelectedChild(res.data[0]._id);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedChild) return;
    getChildSummary(selectedChild).then((res) => setSummary(res.data));
  }, [selectedChild]);

  if (loading) return <DashboardLayout><p className="text-sm text-slate-500">Loading...</p></DashboardLayout>;

  if (children.length === 0) {
    return (
      <DashboardLayout>
        <div className="text-center py-12 text-sm text-slate-500 bg-white rounded-xl border border-slate-200">
          No students linked to your account yet. Contact your institute.
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Welcome, {user?.name?.split(' ')[0]}</h1>
          <p className="text-sm text-slate-500 mt-1">Here's how your child is doing.</p>
        </div>
        {children.length > 1 && (
          <select
            value={selectedChild}
            onChange={(e) => setSelectedChild(e.target.value)}
            className="rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          >
            {children.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        )}
      </div>

      {summary && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-center gap-2 text-slate-500 text-sm"><ClipboardCheck size={15} /> Attendance</div>
              <p className="text-2xl font-semibold text-slate-900 mt-2">{summary.attendance.attendancePercentage}%</p>
              <p className="text-xs text-slate-400 mt-1">{summary.attendance.present} present · {summary.attendance.absent} absent</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-center gap-2 text-slate-500 text-sm"><Wallet size={15} /> Fees Balance</div>
              <p className="text-2xl font-semibold text-slate-900 mt-2">₹{summary.fees.balanceDue.toLocaleString()}</p>
              <p className="text-xs text-slate-400 mt-1">₹{summary.fees.totalPaid.toLocaleString()} paid of ₹{summary.fees.totalOwed.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-center gap-2 text-slate-500 text-sm"><GraduationCap size={15} /> Batch</div>
              <p className="text-lg font-semibold text-slate-900 mt-2">{summary.student.batchId?.name || '—'}</p>
              <p className="text-xs text-slate-400 mt-1">Admission #{summary.student.admissionNumber}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 mt-6">
            <div className="flex items-center gap-2 mb-4">
              <Megaphone size={16} className="text-brand-600" />
              <h3 className="text-sm font-semibold text-slate-900">Notices</h3>
            </div>
            {summary.notices.length === 0 ? (
              <p className="text-sm text-slate-400">No notices right now.</p>
            ) : (
              <div className="space-y-3">
                {summary.notices.map((n) => (
                  <div key={n._id} className="border-b border-slate-100 last:border-0 pb-3 last:pb-0">
                    <p className="text-sm font-medium text-slate-900">{n.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{n.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </DashboardLayout>
  );
}

export default ParentDashboard;