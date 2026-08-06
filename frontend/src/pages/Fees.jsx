import { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import Table from '../components/Table';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Button from '../components/Button';
import Tabs from '../components/Tabs';
import { getFeeStructures, createFeeStructure, recordPayment, getDefaulters } from '../api/feeApi';
import { getBatches } from '../api/batchApi';
import { getStudents } from '../api/studentApi';

function Fees() {
  const [activeTab, setActiveTab] = useState('structures');

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Fees</h1>
        <p className="text-sm text-slate-500 mt-1">Fee structures, payments, and defaulters</p>
      </div>

      <Tabs
        tabs={[
          { key: 'structures', label: 'Fee Structures' },
          { key: 'payment', label: 'Record Payment' },
          { key: 'defaulters', label: 'Defaulters' },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      <div className="mt-6">
        {activeTab === 'structures' && <FeeStructuresTab />}
        {activeTab === 'payment' && <RecordPaymentTab />}
        {activeTab === 'defaulters' && <DefaultersTab />}
      </div>
    </DashboardLayout>
  );
}

// ---------- TAB 1: Fee Structures ----------
function FeeStructuresTab() {
  const [structures, setStructures] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    batchId: '',
    totalAmount: '',
    installments: [{ label: 'Installment 1', amount: '', dueDate: '' }],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [structRes, batchRes] = await Promise.all([getFeeStructures(), getBatches()]);
      setStructures(structRes.data);
      setBatches(batchRes.data);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setFormData({
      batchId: batches[0]?._id || '',
      totalAmount: '',
      installments: [{ label: 'Installment 1', amount: '', dueDate: '' }],
    });
    setError('');
    setIsModalOpen(true);
  };

  const updateInstallment = (index, field, value) => {
    const updated = [...formData.installments];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, installments: updated });
  };

  const addInstallment = () => {
    setFormData({
      ...formData,
      installments: [...formData.installments, { label: `Installment ${formData.installments.length + 1}`, amount: '', dueDate: '' }],
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await createFeeStructure({
        ...formData,
        totalAmount: Number(formData.totalAmount),
        installments: formData.installments.map((i) => ({ ...i, amount: Number(i.amount) })),
      });
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create fee structure');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { key: 'batchId', label: 'Batch', render: (row) => row.batchId?.name || '—' },
    { key: 'totalAmount', label: 'Total Amount', render: (row) => `₹${row.totalAmount.toLocaleString()}` },
    { key: 'installments', label: 'Installments', render: (row) => row.installments?.length },
  ];

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={openCreateModal}>+ New Fee Structure</Button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading...</p>
      ) : (
        <Table columns={columns} data={structures} emptyMessage="No fee structures created yet." />
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Fee Structure">
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
            label="Total Amount (₹)"
            type="number"
            value={formData.totalAmount}
            onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
            required
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Installments</label>
            <div className="space-y-2">
              {formData.installments.map((inst, i) => (
                <div key={i} className="grid grid-cols-3 gap-2">
                  <input
                    value={inst.label}
                    onChange={(e) => updateInstallment(i, 'label', e.target.value)}
                    placeholder="Label"
                    className="rounded-lg border border-slate-300 px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                  <input
                    type="number"
                    value={inst.amount}
                    onChange={(e) => updateInstallment(i, 'amount', e.target.value)}
                    placeholder="Amount"
                    className="rounded-lg border border-slate-300 px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                  <input
                    type="date"
                    value={inst.dueDate}
                    onChange={(e) => updateInstallment(i, 'dueDate', e.target.value)}
                    className="rounded-lg border border-slate-300 px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
              ))}
            </div>
            <button type="button" onClick={addInstallment} className="mt-2 text-sm font-medium text-brand-600 hover:text-brand-700">
              + Add installment
            </button>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>
          )}

          <div className="flex gap-2 pt-2">
            <Button type="submit" loading={saving} className="flex-1">Create</Button>
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ---------- TAB 2: Record Payment ----------
function RecordPaymentTab() {
  const [students, setStudents] = useState([]);
  const [structures, setStructures] = useState([]);
  const [formData, setFormData] = useState({ studentId: '', feeStructureId: '', amountPaid: '', paymentMethod: 'cash' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text }

  useEffect(() => {
    Promise.all([getStudents(), getFeeStructures()]).then(([sRes, fRes]) => {
      setStudents(sRes.data);
      setStructures(fRes.data);
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await recordPayment({ ...formData, amountPaid: Number(formData.amountPaid) });
      setMessage({ type: 'success', text: `Payment recorded. Receipt: ${res.data.receiptNumber}` });
      setFormData({ studentId: '', feeStructureId: '', amountPaid: '', paymentMethod: 'cash' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to record payment' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-xl border border-slate-200 p-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Student</label>
          <select
            value={formData.studentId}
            onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            required
          >
            <option value="">Select student</option>
            {students.map((s) => <option key={s._id} value={s._id}>{s.name} ({s.admissionNumber})</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Fee Structure</label>
          <select
            value={formData.feeStructureId}
            onChange={(e) => setFormData({ ...formData, feeStructureId: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            required
          >
            <option value="">Select fee structure</option>
            {structures.map((f) => (
              <option key={f._id} value={f._id}>
                {f.batchId?.name || 'Unknown batch'} — ₹{f.totalAmount.toLocaleString()}
              </option>
            ))}
          </select>
        </div>

        <Input
          label="Amount Paid (₹)"
          type="number"
          value={formData.amountPaid}
          onChange={(e) => setFormData({ ...formData, amountPaid: e.target.value })}
          required
        />

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Payment Method</label>
          <select
            value={formData.paymentMethod}
            onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          >
            <option value="cash">Cash</option>
            <option value="upi">UPI</option>
            <option value="card">Card</option>
            <option value="razorpay">Razorpay</option>
          </select>
        </div>

        {message && (
          <div className={`rounded-lg px-3 py-2 text-sm border ${
            message.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            {message.text}
          </div>
        )}

        <Button type="submit" loading={saving} className="w-full">Record Payment</Button>
      </form>
    </div>
  );
}

// ---------- TAB 3: Defaulters (the aggregation view) ----------
function DefaultersTab() {
  const [defaulters, setDefaulters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDefaulters()
      .then((res) => setDefaulters(res.data))
      .finally(() => setLoading(false));
  }, []);

  const columns = [
    { key: 'studentName', label: 'Student' },
    { key: 'admissionNumber', label: 'Admission No.' },
    { key: 'totalAmount', label: 'Total Fee', render: (row) => `₹${row.totalAmount.toLocaleString()}` },
    { key: 'totalPaid', label: 'Paid', render: (row) => `₹${row.totalPaid.toLocaleString()}` },
    {
      key: 'balanceDue',
      label: 'Balance Due',
      render: (row) => (
        <span className="font-semibold text-red-600">₹{row.balanceDue.toLocaleString()}</span>
      ),
    },
  ];

  return (
    <div>
      {loading ? (
        <p className="text-sm text-slate-500">Loading...</p>
      ) : (
        <Table
          columns={columns}
          data={defaulters}
          emptyMessage="No pending dues right now. Everyone's paid up 🎉"
        />
      )}
    </div>
  );
}

export default Fees;
