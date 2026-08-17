import { useState, useEffect } from 'react';
import { Megaphone, Trash2 } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Button from '../components/Button';
import { getNotices, createNotice, deleteNotice } from '../api/noticeApi';
import { getBatches } from '../api/batchApi';
import { useAuth } from '../context/AuthContext';
import { getMyChildren } from '../api/parentApi';

function Notices() {
  const { user } = useAuth();
  const [notices, setNotices] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ title: '', content: '', batchId: '' });

  const canManage = ['super_admin', 'branch_admin', 'teacher'].includes(user?.role);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      let noticeParams = {};

      if (user?.role === 'parent') {
      // Scope to the parent's own child's batch — same principle as isOwnChild elsewhere
      const childrenRes = await getMyChildren();
      const firstChild = childrenRes.data[0];
      if (firstChild?.batchId) {
        noticeParams = { batchId: firstChild.batchId._id || firstChild.batchId };
      }
    }

      const [noticeRes, batchRes] = await Promise.all([getNotices(), getBatches()]);
      setNotices(noticeRes.data);
      setBatches(batchRes.data);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setFormData({ title: '', content: '', batchId: '' });
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await createNotice({ ...formData, batchId: formData.batchId || null });
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post notice');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this notice?')) return;
    await deleteNotice(id);
    loadData();
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Notices</h1>
          <p className="text-sm text-slate-500 mt-1">Institute-wide and batch-specific announcements</p>
        </div>
        {canManage && <Button onClick={openCreateModal}>+ New Notice</Button>}
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading...</p>
      ) : notices.length === 0 ? (
        <div className="text-center py-12 text-sm text-slate-500 bg-white rounded-xl border border-slate-200">
          No notices posted yet.
        </div>
      ) : (
        <div className="space-y-3">
          {notices.map((notice) => (
            <div key={notice._id} className="bg-white rounded-xl border border-slate-200 p-5 flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                  <Megaphone size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-slate-900">{notice.title}</p>
                    {notice.batchId ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">
                        {notice.batchId.name}
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium">
                        Institute-wide
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 mt-1">{notice.content}</p>
                  <p className="text-xs text-slate-400 mt-2">
                    {notice.createdBy?.name} · {new Date(notice.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              {canManage && (
                <button onClick={() => handleDelete(notice._id)} className="text-slate-400 hover:text-red-600 shrink-0">
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Notice">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Content</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={3}
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Audience</label>
            <select
              value={formData.batchId}
              onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            >
              <option value="">Institute-wide (everyone)</option>
              {batches.map((b) => <option key={b._id} value={b._id}>{b.name} only</option>)}
            </select>
          </div>

          {error && <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>}

          <div className="flex gap-2 pt-2">
            <Button type="submit" loading={saving} className="flex-1">Post Notice</Button>
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}

export default Notices;