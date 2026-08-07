import { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import Table from '../components/Table';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Button from '../components/Button';
import { getStaff, createStaff, updateStaff, deactivateStaff } from '../api/staffApi';
import { useAuth } from '../context/AuthContext';

const roleLabels = {
  branch_admin: 'Branch Admin',
  accountant: 'Accountant',
  teacher: 'Teacher',
  front_desk: 'Front Desk',
};

function Staff() {
  const { user } = useAuth();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'teacher', phone: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await getStaff();
      setStaff(res.data);
    } catch (err) {
      setError('Failed to load staff');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingStaff(null);
    setFormData({ name: '', email: '', password: '', role: 'teacher', phone: '' });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (member) => {
    setEditingStaff(member);
    setFormData({ name: member.name, email: member.email, password: '', role: member.role, phone: member.phone || '' });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      if (editingStaff) {
        // Password field is intentionally excluded from edit — changing a password
        // is a separate, more sensitive flow we're not building here (would need
        // the user's own confirmation, not an admin silently resetting it).
        await updateStaff(editingStaff._id, { name: formData.name, phone: formData.phone, role: formData.role });
      } else {
        await createStaff(formData);
      }
      setIsModalOpen(false);
      fetchStaff();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save staff member');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (member) => {
    if (!window.confirm(`Deactivate ${member.name}? They will no longer be able to log in.`)) return;
    try {
      await deactivateStaff(member._id);
      fetchStaff();
    } catch (err) {
      setError('Failed to deactivate staff member');
    }
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role', render: (row) => roleLabels[row.role] || row.role },
    { key: 'phone', label: 'Phone', render: (row) => row.phone || '—' },
    {
      key: 'isActive',
      label: 'Status',
      render: (row) => (
        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
          row.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
        }`}>
          {row.isActive ? 'Active' : 'Deactivated'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (row) =>
        row.isActive && (
          <button
            onClick={(e) => { e.stopPropagation(); handleDeactivate(row); }}
            className="text-xs font-medium text-red-600 hover:text-red-700"
          >
            Deactivate
          </button>
        ),
    },
  ];

  // Only super_admin can assign the branch_admin role — mirrors the backend restriction exactly
  const availableRoles = user?.role === 'super_admin'
    ? ['branch_admin', 'accountant', 'teacher', 'front_desk']
    : ['accountant', 'teacher', 'front_desk'];

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Staff</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your team's access to the system</p>
        </div>
        <Button onClick={openCreateModal}>+ Add Staff</Button>
      </div>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      {loading ? (
        <p className="text-sm text-slate-500">Loading...</p>
      ) : (
        <Table columns={columns} data={staff} onRowClick={openEditModal} emptyMessage="No staff added yet." />
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingStaff ? 'Edit Staff' : 'Add Staff'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Full Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            disabled={!!editingStaff}
            required
          />
          {!editingStaff && (
            <Input
              label="Temporary Password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="They can change this after logging in"
              required
            />
          )}
          <Input label="Phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            >
              {availableRoles.map((r) => <option key={r} value={r}>{roleLabels[r]}</option>)}
            </select>
          </div>

          {formError && <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{formError}</div>}

          <div className="flex gap-2 pt-2">
            <Button type="submit" loading={saving} className="flex-1">{editingStaff ? 'Save Changes' : 'Add Staff'}</Button>
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}

export default Staff;