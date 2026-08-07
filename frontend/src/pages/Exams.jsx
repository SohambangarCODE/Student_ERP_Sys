import { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import Table from '../components/Table';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Button from '../components/Button';
import Tabs from '../components/Tabs';
import { getExams, createExam, enterMarks, getExamRankings } from '../api/examApi';
import { getBatches } from '../api/batchApi';
import { getStudents } from '../api/studentApi';

function Exams() {
  const [activeTab, setActiveTab] = useState('exams');

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Exams</h1>
        <p className="text-sm text-slate-500 mt-1">Create exams, enter marks, and view rankings</p>
      </div>

      <Tabs
        tabs={[
          { key: 'exams', label: 'Exams' },
          { key: 'marks', label: 'Enter Marks' },
          { key: 'rankings', label: 'Rankings' },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      <div className="mt-6">
        {activeTab === 'exams' && <ExamsTab />}
        {activeTab === 'marks' && <EnterMarksTab />}
        {activeTab === 'rankings' && <RankingsTab />}
      </div>
    </DashboardLayout>
  );
}

// ---------- TAB 1: Exams list + create ----------
function ExamsTab() {
  const [exams, setExams] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    batchId: '',
    name: '',
    examDate: '',
    subjects: [{ name: '', maxMarks: '' }],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [examRes, batchRes] = await Promise.all([getExams(), getBatches()]);
      setExams(examRes.data);
      setBatches(batchRes.data);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setFormData({ batchId: batches[0]?._id || '', name: '', examDate: '', subjects: [{ name: '', maxMarks: '' }] });
    setError('');
    setIsModalOpen(true);
  };

  const updateSubject = (index, field, value) => {
    const updated = [...formData.subjects];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, subjects: updated });
  };

  const addSubject = () => {
    setFormData({ ...formData, subjects: [...formData.subjects, { name: '', maxMarks: '' }] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await createExam({
        ...formData,
        subjects: formData.subjects.map((s) => ({ ...s, maxMarks: Number(s.maxMarks) })),
      });
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create exam');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { key: 'name', label: 'Exam Name' },
    { key: 'batchId', label: 'Batch', render: (row) => row.batchId?.name || '—' },
    { key: 'examDate', label: 'Date', render: (row) => new Date(row.examDate).toLocaleDateString() },
    { key: 'subjects', label: 'Subjects', render: (row) => row.subjects?.map((s) => s.name).join(', ') },
  ];

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={openCreateModal}>+ New Exam</Button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading...</p>
      ) : (
        <Table columns={columns} data={exams} emptyMessage="No exams created yet." />
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Exam">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Batch</label>
            <select
              value={formData.batchId}
              onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              required
            >
              <option value="">Select a batch</option>
              {batches.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
            </select>
          </div>

          <Input
            label="Exam Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Mid-Term 2026"
            required
          />

          <Input
            label="Exam Date"
            type="date"
            value={formData.examDate}
            onChange={(e) => setFormData({ ...formData, examDate: e.target.value })}
            required
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Subjects</label>
            <div className="space-y-2">
              {formData.subjects.map((subj, i) => (
                <div key={i} className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    value={subj.name}
                    onChange={(e) => updateSubject(i, 'name', e.target.value)}
                    placeholder="Subject name"
                    className="rounded-lg border border-slate-300 px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    required
                  />
                  <input
                    type="number"
                    value={subj.maxMarks}
                    onChange={(e) => updateSubject(i, 'maxMarks', e.target.value)}
                    placeholder="Max marks"
                    className="rounded-lg border border-slate-300 px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    required
                  />
                </div>
              ))}
            </div>
            <button type="button" onClick={addSubject} className="mt-2 text-sm font-medium text-brand-600 hover:text-brand-700">
              + Add subject
            </button>
          </div>

          {error && <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>}

          <div className="flex gap-2 pt-2">
            <Button type="submit" loading={saving} className="flex-1">Create Exam</Button>
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ---------- TAB 2: Enter Marks ----------
function EnterMarksTab() {
  const [exams, setExams] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [marks, setMarks] = useState([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    Promise.all([getExams(), getStudents()]).then(([eRes, sRes]) => {
      setExams(eRes.data);
      setStudents(sRes.data);
    });
  }, []);

  // When exam selection changes, build the marks form based on that exam's subjects
  useEffect(() => {
    const exam = exams.find((e) => e._id === selectedExam);
    if (exam) {
      setMarks(exam.subjects.map((s) => ({ subjectName: s.name, maxMarks: s.maxMarks, marksObtained: '' })));
    } else {
      setMarks([]);
    }
  }, [selectedExam, exams]);

  const updateMark = (index, value) => {
    const updated = [...marks];
    updated[index] = { ...updated[index], marksObtained: value };
    setMarks(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await enterMarks(selectedExam, {
        studentId: selectedStudent,
        marks: marks.map(({ subjectName, marksObtained }) => ({ subjectName, marksObtained: Number(marksObtained) })),
      });
      setMessage({ type: 'success', text: 'Marks saved successfully' });
      setSelectedStudent('');
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to save marks' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-md">
      <div className="space-y-4 bg-white rounded-xl border border-slate-200 p-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Exam</label>
          <select
            value={selectedExam}
            onChange={(e) => setSelectedExam(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          >
            <option value="">Select an exam</option>
            {exams.map((ex) => <option key={ex._id} value={ex._id}>{ex.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Student</label>
          <select
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          >
            <option value="">Select a student</option>
            {students.map((s) => <option key={s._id} value={s._id}>{s.name} ({s.admissionNumber})</option>)}
          </select>
        </div>

        {marks.length > 0 && (
          <form onSubmit={handleSubmit} className="space-y-3">
            {marks.map((m, i) => (
              <div key={m.subjectName} className="flex items-center gap-3">
                <label className="flex-1 text-sm text-slate-700">{m.subjectName} (max {m.maxMarks})</label>
                <input
                  type="number"
                  value={m.marksObtained}
                  onChange={(e) => updateMark(i, e.target.value)}
                  max={m.maxMarks}
                  min={0}
                  className="w-24 rounded-lg border border-slate-300 px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  required
                />
              </div>
            ))}

            {message && (
              <div className={`rounded-lg px-3 py-2 text-sm border ${
                message.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
              }`}>
                {message.text}
              </div>
            )}

            <Button type="submit" loading={saving} disabled={!selectedStudent} className="w-full">
              Save Marks
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

// ---------- TAB 3: Rankings ----------
function RankingsTab() {
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getExams().then((res) => setExams(res.data));
  }, []);

  useEffect(() => {
    if (!selectedExam) {
      setRankings([]);
      return;
    }
    setLoading(true);
    getExamRankings(selectedExam)
      .then((res) => setRankings(res.data))
      .finally(() => setLoading(false));
  }, [selectedExam]);

  const columns = [
    { key: 'rank', label: 'Rank', render: (row) => <span className="font-semibold text-brand-600">#{row.rank}</span> },
    { key: 'studentName', label: 'Student' },
    { key: 'totalScore', label: 'Total Score' },
  ];

  return (
    <div>
      <div className="max-w-sm mb-6">
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Exam</label>
        <select
          value={selectedExam}
          onChange={(e) => setSelectedExam(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
        >
          <option value="">Select an exam</option>
          {exams.map((ex) => <option key={ex._id} value={ex._id}>{ex.name}</option>)}
        </select>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading...</p>
      ) : selectedExam ? (
        <Table columns={columns} data={rankings} emptyMessage="No results entered for this exam yet." />
      ) : (
        <div className="text-center py-12 text-sm text-slate-500 bg-white rounded-xl border border-slate-200">
          Select an exam to see rankings
        </div>
      )}
    </div>
  );
}

export default Exams;