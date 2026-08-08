import { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import Table from '../components/Table';
import { getMyChildren, getChildAttendance } from '../api/parentApi';

function MyAttendance() {
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState('');
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyChildren().then((res) => {
      setChildren(res.data);
      if (res.data.length > 0) setSelectedChild(res.data[0]._id);
    });
  }, []);

  useEffect(() => {
    if (!selectedChild) return;
    setLoading(true);
    getChildAttendance(selectedChild).then((res) => setAttendance(res.data)).finally(() => setLoading(false));
  }, [selectedChild]);

  const columns = [
    { key: 'date', label: 'Date', render: (row) => new Date(row.date).toLocaleDateString() },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
          row.status === 'present' ? 'bg-green-100 text-green-700' :
          row.status === 'absent' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
        }`}>
          {row.status}
        </span>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Attendance History</h1>
          <p className="text-sm text-slate-500 mt-1">Full day-by-day attendance record</p>
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

      {loading ? (
        <p className="text-sm text-slate-500">Loading...</p>
      ) : (
        <Table columns={columns} data={attendance} emptyMessage="No attendance records yet." />
      )}
    </DashboardLayout>
  );
}

export default MyAttendance;
