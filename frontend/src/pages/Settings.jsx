import { useState, useEffect } from 'react';
import { Upload, Lock, User, Building2, Users, Mail, Phone, KeyRound } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import Input from '../components/Input';
import Button from '../components/Button';
import { getMe, updateMe, changePassword } from '../api/userApi';
import { getMyInstitute, updateMyInstitute, uploadLogo } from '../api/instituteApi';
import { useAuth } from '../context/AuthContext';

const ROLE_LABELS = {
  super_admin: 'Super Admin',
  branch_admin: 'Branch Admin',
  accountant: 'Accountant',
  teacher: 'Teacher',
  front_desk: 'Front Desk',
  parent: 'Parent',
};

function Settings() {
  const { user } = useAuth();
  const isInstituteAdmin = ['super_admin', 'branch_admin'].includes(user?.role);

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your profile, security, and preferences</p>
      </div>

      <div className="max-w-3xl space-y-8">
        {/* Profile Section - Always visible */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <ProfileSection />
        </section>

        {/* Password Section - Always visible */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <PasswordSection />
        </section>

        {/* Institute Section - Admin only */}
        {isInstituteAdmin && (
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <InstituteSection />
          </section>
        )}

        {/* Linked Children Section - Parent only */}
        {user?.role === 'parent' && (
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <LinkedChildrenSection />
          </section>
        )}
      </div>
    </DashboardLayout>
  );
}

// ---------- Profile Section ----------
function ProfileSection() {
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({ name: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    getMe().then((res) => {
      setProfile(res.data);
      setFormData({ name: res.data.name, phone: res.data.phone || '' });
    });
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await updateMe(formData);
      setProfile(res.data);
      setMessage({ type: 'success', text: 'Profile updated successfully.' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  if (!profile) return null;

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-14 w-14 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 text-white font-semibold flex items-center justify-center text-xl shadow-sm">
          {profile.name?.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-slate-900 text-lg">{profile.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-50 text-brand-700 border border-brand-200">
              {ROLE_LABELS[profile.role] || profile.role}
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Input
            label="Full Name"
            icon={<User size={16} className="text-slate-400" />}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={profile.email}
                disabled
                className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3.5 py-2.5 text-sm text-slate-500 cursor-not-allowed"
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">Email cannot be changed. Contact support for assistance.</p>
          </div>
        </div>

        <Input
          label="Phone Number"
          icon={<Phone size={16} className="text-slate-400" />}
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          placeholder="Enter phone number"
        />

        {message && (
          <div className={`rounded-lg px-4 py-3 text-sm border ${
            message.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-700' 
              : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            {message.text}
          </div>
        )}

        <div className="flex justify-end">
          <Button type="submit" loading={saving} className="min-w-[140px]">
            Save Profile
          </Button>
        </div>
      </form>
    </div>
  );
}

// ---------- Password Section ----------
function PasswordSection() {
  const [formData, setFormData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    
    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (formData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters long' });
      return;
    }

    setSaving(true);
    try {
      await changePassword({ 
        currentPassword: formData.currentPassword, 
        newPassword: formData.newPassword 
      });
      setMessage({ type: 'success', text: 'Password changed successfully.' });
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to change password' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-brand-50">
          <KeyRound size={18} className="text-brand-600" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-900">Security</h3>
          <p className="text-sm text-slate-500">Update your password to keep your account secure</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Input
            label="Current Password"
            type="password"
            icon={<Lock size={16} className="text-slate-400" />}
            value={formData.currentPassword}
            onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
            required
            placeholder="Enter current password"
          />
          <div></div> {/* Spacer for grid alignment */}
          <Input
            label="New Password"
            type="password"
            icon={<Lock size={16} className="text-slate-400" />}
            value={formData.newPassword}
            onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
            required
            placeholder="Enter new password"
          />
          <Input
            label="Confirm New Password"
            type="password"
            icon={<Lock size={16} className="text-slate-400" />}
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            required
            placeholder="Confirm new password"
          />
        </div>

        {message && (
          <div className={`rounded-lg px-4 py-3 text-sm border ${
            message.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-700' 
              : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            {message.text}
          </div>
        )}

        <div className="flex justify-end">
          <Button type="submit" loading={saving} className="min-w-[140px]">
            Update Password
          </Button>
        </div>
      </form>
    </div>
  );
}

// ---------- Institute Section ----------
function InstituteSection() {
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
      setMessage({ type: 'success', text: 'Institute details updated successfully.' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update details' });
    } finally {
      setSaving(false);
    }
  };

  const handleLogoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file size (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Logo file must be less than 2MB' });
      return;
    }

    setUploading(true);
    setMessage(null);
    try {
      const res = await uploadLogo(file);
      setInstitute(res.data);
      setMessage({ type: 'success', text: 'Logo uploaded successfully.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to upload logo' });
    } finally {
      setUploading(false);
      e.target.value = ''; // Reset input
    }
  };

  if (!institute) return null;

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-brand-50">
          <Building2 size={18} className="text-brand-600" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-900">Institute Settings</h3>
          <p className="text-sm text-slate-500">Manage your institute's branding and details</p>
        </div>
      </div>

      {/* Logo Section */}
      <div className="mb-8 p-5 bg-slate-50 rounded-xl border border-slate-200">
        <h4 className="text-sm font-medium text-slate-900 mb-4">Institute Logo</h4>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="h-20 w-20 rounded-xl border-2 border-dashed border-slate-300 bg-white flex items-center justify-center overflow-hidden shrink-0">
            {institute.logoUrl ? (
              <img 
                src={`http://localhost:5000${institute.logoUrl}`} 
                alt="Institute logo" 
                className="h-full w-full object-contain p-2" 
              />
            ) : (
              <div className="text-center">
                <Building2 size={24} className="text-slate-300 mx-auto" />
                <span className="text-[10px] text-slate-400 block mt-1">No logo</span>
              </div>
            )}
          </div>
          <div className="flex-1">
            <label className="cursor-pointer inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
              <Upload size={16} />
              {uploading ? 'Uploading...' : 'Choose Logo'}
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleLogoChange} 
                className="hidden" 
                disabled={uploading} 
              />
            </label>
            <p className="text-xs text-slate-400 mt-2">PNG or JPG, up to 2MB. Recommended: 200x200px</p>
          </div>
        </div>
      </div>

      {/* Institute Details Form */}
      <form onSubmit={handleSave} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Input
            label="Institute Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="Enter institute name"
          />
          <Input
            label="Contact Email"
            type="email"
            value={formData.contactEmail}
            onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
            placeholder="contact@institute.com"
          />
        </div>

        <Input
          label="Address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          placeholder="Enter institute address"
        />

        <Input
          label="Contact Phone"
          value={formData.contactPhone}
          onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
          placeholder="Enter contact phone number"
        />

        {message && (
          <div className={`rounded-lg px-4 py-3 text-sm border ${
            message.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-700' 
              : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            {message.text}
          </div>
        )}

        <div className="flex justify-end">
          <Button type="submit" loading={saving} className="min-w-[140px]">
            Save Institute Details
          </Button>
        </div>
      </form>
    </div>
  );
}

// ---------- Linked Children Section ----------
function LinkedChildrenSection() {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    getMe().then((res) => setProfile(res.data));
  }, []);

  if (!profile) return null;

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-brand-50">
          <Users size={18} className="text-brand-600" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-900">Linked Students</h3>
          <p className="text-sm text-slate-500">Students associated with your account</p>
        </div>
      </div>

      {profile.children?.length === 0 ? (
        <div className="text-center py-8">
          <Users size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No students linked to your account</p>
          <p className="text-xs text-slate-400 mt-1">Contact your institute's front desk to link additional students</p>
        </div>
      ) : (
        <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
          <div className="divide-y divide-slate-200">
            {profile.children.map((c) => (
              <div key={c._id} className="flex items-center justify-between px-4 py-3 hover:bg-white transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-brand-100 text-brand-700 text-sm font-semibold flex items-center justify-center">
                    {c.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-slate-900">{c.name}</span>
                </div>
                <span className="text-xs text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">
                  {c.admissionNumber || 'ID: N/A'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
        <p className="text-xs text-blue-700">
          <span className="font-medium">Need help?</span> To link another child, please contact your institute's front desk or administration.
        </p>
      </div>
    </div>
  );
}

export default Settings;