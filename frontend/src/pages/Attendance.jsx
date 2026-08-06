import { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import Button from '../components/Button';
import Tabs from '../components/Tabs';
import Table from '../components/Table';
import { markBulkAttendance, getStudentAttendanceSummary } from '../api/attendanceApi';
import { getBatches } from '../api/batchApi';
import { getStudents } from '../api/studentApi';

function Attendance() {
  const [activeTab, setActiveTab] = useState('mark');

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Attendance</h1>
        <p className="text-sm text-slate-500 mt-1">Mark daily attendance and view summaries</p>
      </div>

      <Tabs
        tabs={[
          { key: 'mark', label: 'Mark Attendance' },
          { key: 'summary', label: 'Student Summary' },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      <div className="mt-6">
        {activeTab === 'mark' && <MarkAttendanceTab />}
        {activeTab === 'summary' && <SummaryTab />}
      </div>
    </DashboardLayout>
  );
}

// ---------- TAB 1: Mark Attendance (bulk, per batch, per date) ----------
function MarkAttendanceTab() {
  const [batches, setBatches] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]); // defaults to today
  const [statusMap, setStatusMap] = useState({}); // { studentId: 'present' | 'absent' | 'late' }
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    Promise.all([getBatches(), getStudents()]).then(([bRes, sRes]) => {
      setBatches(bRes.data);
      setAllStudents(sRes.data);
    });
  }, []);

  // Students belonging to the currently selected batch only
  const batchStudents = allStudents.filter((s) => s.batchId === selectedBatch || s.batchId?._id === selectedBatch);

  // When the batch selection changes, default every student in it to "present"
  // — in real classrooms, most students attend most days, so this saves the teacher clicks;
  // they only need to change the few who are actually absent.
  useEffect(() => {
    if (selectedBatch) {
      const defaults = {};
      batchStudents.forEach((s) => { defaults[s._id] = 'present'; });
      setStatusMap(defaults);
    }
  }, [selectedBatch, allStudents]);

  const setStatus = (studentId, status) => {
    setStatusMap({ ...statusMap, [studentId]: status });
  };

  const handleSubmit = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const records = Object.entries(statusMap).map(([studentId, status]) => ({ studentId, status }));
      const res = await markBulkAttendance({ batchId: selectedBatch, date, records });
      setMessage({ type: 'success', text: res.data.message });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to mark attendance' });
    } finally {
      setSaving(false);
    }
  };

  const statusStyles = {
    present: 'bg-green-100 text-green-700',
    absent: 'bg-red-100 text-red-700',
    late: 'bg-amber-100 text-amber-700',
  };

  return (
    <div>
      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Batch</label>
          <select
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          >
            <option value="">Select a batch</option>
            {batches.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </div>
      </div>

      {!selectedBatch ? (
        <div className="text-center py-12 text-sm text-slate-500 bg-white rounded-xl border border-slate-200">
          Select a batch to see its students
        </div>
      ) : batchStudents.length === 0 ? (
        <div className="text-center py-12 text-sm text-slate-500 bg-white rounded-xl border border-slate-200">
          No students assigned to this batch yet
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left font-medium text-slate-500 px-4 py-3">Student</th>
                  <th className="text-left font-medium text-slate-500 px-4 py-3">Admission No.</th>
                  <th className="text-left font-medium text-slate-500 px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {batchStudents.map((s) => (
                  <tr key={s._id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3 text-slate-900 font-medium">{s.name}</td>
                    <td className="px-4 py-3 text-slate-500">{s.admissionNumber}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        {['present', 'absent', 'late'].map((status) => (
                          <button
                            key={status}
                            type="button"
                            onClick={() => setStatus(s._id, status)}
                            className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize transition-colors ${
                              statusMap[s._id] === status
                                ? statusStyles[status]
                                : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                            }`}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {message && (
            <div className={`mt-4 rounded-lg px-3 py-2 text-sm border ${
              message.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              {message.text}
            </div>
          )}

          <Button onClick={handleSubmit} loading={saving} className="mt-4">
            Submit Attendance
          </Button>
        </>
      )}
    </div>
  );
}

// ---------- TAB 2: Student Attendance Summary ----------
function SummaryTab() {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getStudents().then((res) => setStudents(res.data));
  }, []);

  useEffect(() => {
    if (!selectedStudent) {
      setSummary(null);
      return;
    }
    setLoading(true);
    getStudentAttendanceSummary(selectedStudent)
      .then((res) => setSummary(res.data))
      .finally(() => setLoading(false));
  }, [selectedStudent]);

  return (
    <div className="max-w-md">
      <label className="block text-sm font-medium text-slate-700 mb-1.5">Student</label>
      <select
        value={selectedStudent}
        onChange={(e) => setSelectedStudent(e.target.value)}
        className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 mb-6"
      >
        <option value="">Select a student</option>
        {students.map((s) => <option key={s._id} value={s._id}>{s.name} ({s.admissionNumber})</option>)}
      </select>

      {loading && <p className="text-sm text-slate-500">Loading...</p>}

      {summary && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-slate-500">Attendance Percentage</span>
            <span className="text-2xl font-semibold text-brand-600">{summary.attendancePercentage}%</span>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-green-50 rounded-lg py-3">
              <p className="text-lg font-semibold text-green-700">{summary.present}</p>
              <p className="text-xs text-green-600">Present</p>
            </div>
            <div className="bg-red-50 rounded-lg py-3">
              <p className="text-lg font-semibold text-red-700">{summary.absent}</p>
              <p className="text-xs text-red-600">Absent</p>
            </div>
            <div className="bg-amber-50 rounded-lg py-3">
              <p className="text-lg font-semibold text-amber-700">{summary.late}</p>
              <p className="text-xs text-amber-600">Late</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Attendance;