import { useState, useEffect } from 'react';
import { Upload } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import Input from '../components/Input';
import Button from '../components/Button';
import { getMyInstitute, updateMyInstitute, uploadLogo } from '../api/instituteApi';

function Settings() {
  const [institute, setInstitute] = useState(null);
  const [formData, setFormData] = useState({ name: '', address: '', contactPhone: '', contactEmail: '' });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    getMyInstitute().then((res) => {
      setInstitute(res.data);
      setFormData({
        name: res.data.name || '',
        address: res.data.address || '',
        contactPhone: res.data.contactPhone || '',
        contactEmail: res.data.contactEmail || '',
      });
    });
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await updateMyInstitute(formData);
      setInstitute(res.data);
      setMessage({ type: 'success', text: 'Institute details updated.' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update details' });
    } finally {
      setSaving(false);
    }
  };

  const handleLogoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setMessage(null);
    try {
      const res = await uploadLogo(file);
      setInstitute(res.data);
      setMessage({ type: 'success', text: 'Logo uploaded.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to upload logo' });
    } finally {
      setUploading(false);
    }
  };

  if (!institute) return <DashboardLayout><p className="text-sm text-slate-500">Loading...</p></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Institute Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Update your institute's profile and branding</p>
      </div>

      {message && (
        <div className={`rounded-lg px-3 py-2 text-sm border mb-4 max-w-lg ${
          message.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-lg mb-6">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Logo</h3>
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
            {institute.logoUrl ? (
              <img src={`http://localhost:5000${institute.logoUrl}`} alt="Institute logo" className="h-full w-full object-contain" />
            ) : (
              <span className="text-xs text-slate-400">No logo</span>
            )}
          </div>
          <label className="cursor-pointer inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            <Upload size={15} />
            {uploading ? 'Uploading...' : 'Upload Logo'}
            <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" disabled={uploading} />
          </label>
        </div>
        <p className="text-xs text-slate-400 mt-3">PNG or JPG, up to 2MB. Appears on report cards and receipts.</p>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-xl border border-slate-200 p-6 max-w-lg space-y-4">
        <h3 className="text-sm font-semibold text-slate-900">Institute Details</h3>
        <Input label="Institute Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
        <Input label="Address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
        <Input label="Contact Phone" value={formData.contactPhone} onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })} />
        <Input label="Contact Email" type="email" value={formData.contactEmail} onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })} />
        <Button type="submit" loading={saving}>Save Changes</Button>
      </form>
    </DashboardLayout>
  );
}

export default Settings;