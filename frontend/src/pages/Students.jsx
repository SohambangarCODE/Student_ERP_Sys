import { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import Table from '../components/Table';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Button from '../components/Button';
import { getStudents, createStudent, updateStudent } from '../api/studentApi';

function Students() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null); // null = creating new, object = editing existing
  const [formData, setFormData] = useState({ admissionNumber: '', name: '', dateOfBirth: '', gender: 'male' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Fetch students once when the page loads
  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await getStudents();
      setStudents(res.data);
    } catch (err) {
      setError('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingStudent(null);
    setFormData({ admissionNumber: '', name: '', dateOfBirth: '', gender: 'male' });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (student) => {
    setEditingStudent(student);
    setFormData({
      admissionNumber: student.admissionNumber,
      name: student.name,
      dateOfBirth: student.dateOfBirth ? student.dateOfBirth.split('T')[0] : '',
      gender: student.gender || 'male',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      if (editingStudent) {
        await updateStudent(editingStudent._id, formData);
      } else {
        await createStudent(formData);
      }
      setIsModalOpen(false);
      fetchStudents(); // refresh the list to show the change
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save student');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { key: 'admissionNumber', label: 'Admission No.' },
    { key: 'name', label: 'Name' },
    { key: 'gender', label: 'Gender' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
          row.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
        }`}>
          {row.status}
        </span>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Students</h1>
          <p className="text-sm text-slate-500 mt-1">Manage student admissions and records</p>
        </div>
        <Button onClick={openCreateModal}>+ Add Student</Button>
      </div>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      {loading ? (
        <p className="text-sm text-slate-500">Loading students...</p>
      ) : (
        <Table
          columns={columns}
          data={students}
          onRowClick={openEditModal}
          emptyMessage="No students yet. Click 'Add Student' to admit your first one."
        />
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingStudent ? 'Edit Student' : 'Add Student'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Admission Number"
            value={formData.admissionNumber}
            onChange={(e) => setFormData({ ...formData, admissionNumber: e.target.value })}
            required
          />
          <Input
            label="Full Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            label="Date of Birth"
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Gender</label>
            <select
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          {formError && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
              {formError}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button type="submit" loading={saving} className="flex-1">
              {editingStudent ? 'Save Changes' : 'Add Student'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}

export default Students;