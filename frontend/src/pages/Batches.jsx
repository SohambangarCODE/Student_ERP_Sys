import { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import Table from '../components/Table';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Button from '../components/Button';
import { getBatches, createBatch, updateBatch } from '../api/batchApi';

const emptySlot = { day: 'Monday', startTime: '16:00', endTime: '17:30' };
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function Batches() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);
  const [formData, setFormData] = useState({ name: '', schedule: [emptySlot] });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    setLoading(true);
    try {
      const res = await getBatches();
      setBatches(res.data);
    } catch (err) {
      setError('Failed to load batches');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingBatch(null);
    setFormData({ name: '', schedule: [{ ...emptySlot }] });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (batch) => {
    setEditingBatch(batch);
    setFormData({
      name: batch.name,
      schedule: batch.schedule?.length ? batch.schedule : [{ ...emptySlot }],
    });
    setFormError('');
    setIsModalOpen(true);
  };

  // Update one field of one schedule slot, by index
  const updateSlot = (index, field, value) => {
    const newSchedule = [...formData.schedule];
    newSchedule[index] = { ...newSchedule[index], [field]: value };
    setFormData({ ...formData, schedule: newSchedule });
  };

  const addSlot = () => {
    setFormData({ ...formData, schedule: [...formData.schedule, { ...emptySlot }] });
  };

  const removeSlot = (index) => {
    setFormData({ ...formData, schedule: formData.schedule.filter((_, i) => i !== index) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      if (editingBatch) {
        await updateBatch(editingBatch._id, formData);
      } else {
        await createBatch(formData);
      }
      setIsModalOpen(false);
      fetchBatches();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save batch');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { key: 'name', label: 'Batch Name' },
    {
      key: 'schedule',
      label: 'Schedule',
      render: (row) => (
        <span className="text-slate-500">
          {row.schedule?.map((s) => `${s.day.slice(0, 3)} ${s.startTime}`).join(', ') || '—'}
        </span>
      ),
    },
    {
      key: 'teacherId',
      label: 'Teacher',
      render: (row) => row.teacherId?.name || <span className="text-slate-400">Unassigned</span>,
    },
  ];

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Batches</h1>
          <p className="text-sm text-slate-500 mt-1">Manage classes and coaching batches</p>
        </div>
        <Button onClick={openCreateModal}>+ Add Batch</Button>
      </div>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      {loading ? (
        <p className="text-sm text-slate-500">Loading batches...</p>
      ) : (
        <Table
          columns={columns}
          data={batches}
          onRowClick={openEditModal}
          emptyMessage="No batches yet. Click 'Add Batch' to create your first one."
        />
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBatch ? 'Edit Batch' : 'Add Batch'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Batch Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Class 10-A"
            required
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Schedule</label>
            <div className="space-y-2">
              {formData.schedule.map((slot, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <select
                    value={slot.day}
                    onChange={(e) => updateSlot(i, 'day', e.target.value)}
                    className="flex-1 rounded-lg border border-slate-300 px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  >
                    {days.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <input
                    type="time"
                    value={slot.startTime}
                    onChange={(e) => updateSlot(i, 'startTime', e.target.value)}
                    className="rounded-lg border border-slate-300 px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                  <input
                    type="time"
                    value={slot.endTime}
                    onChange={(e) => updateSlot(i, 'endTime', e.target.value)}
                    className="rounded-lg border border-slate-300 px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                  {formData.schedule.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSlot(i)}
                      className="text-slate-400 hover:text-red-600 px-1"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addSlot}
              className="mt-2 text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              + Add another slot
            </button>
          </div>

          {formError && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
              {formError}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button type="submit" loading={saving} className="flex-1">
              {editingBatch ? 'Save Changes' : 'Add Batch'}
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

export default Batches;