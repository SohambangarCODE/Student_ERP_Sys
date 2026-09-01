import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GraduationCap, BarChart3, Calendar, Crown, School, Wallet, Headset, Building2, Users, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Input from '../components/Input';
import Button from '../components/Button';
import { SUPPORT_EMAIL } from '../lib/constants';

const ROLES = [
  { key: 'super_admin', label: 'Admin', icon: Crown, note: 'The person who registered your institute. Can also register a new institute below.' },
  { key: 'branch_admin', label: 'Branch Admin', icon: Building2, note: 'Ask your super admin for your login credentials.' },
  { key: 'accountant', label: 'Accountant', icon: Wallet, note: 'Ask your institute admin for your login credentials.' },
  { key: 'teacher', label: 'Teacher', icon: School, note: 'Ask your institute admin for your login credentials.' },
  { key: 'front_desk', label: 'Front Desk', icon: Headset, note: 'Ask your institute admin for your login credentials.' },
  { key: 'parent', label: 'Parent', icon: Users, note: "Ask your child's institute for your login credentials." },
];

function Login() {
  const [selectedRole, setSelectedRole] = useState('super_admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const activeRole = ROLES.find((r) => r.key === selectedRole);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // The role picker is a UX aid only — the actual account's role comes from the
      // server based on the email/password, not from whichever card is selected here.
      // We don't send selectedRole anywhere; it just shapes which message the person sees.
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row">
        {/* Left panel — brand illustration, original (no reference artwork reproduced) */}
        <div className="md:w-[38%] bg-brand-600 p-8 sm:p-10 flex flex-col justify-between text-white">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-white text-brand-600 font-bold text-sm flex items-center justify-center">E</div>
            <span className="font-semibold">SCHOLARLYNK</span>
          </div>

          <div className="mt-10 md:mt-0">
            <div className="flex gap-4 mb-6 text-brand-100">
              <GraduationCap size={36} />
              <BarChart3 size={36} />
              <Calendar size={36} />
            </div>
            <h2 className="text-xl font-semibold leading-snug">
              One login for every part of your institute
            </h2>
            <p className="text-sm text-brand-100 mt-2">
              Admissions, fees, attendance, and exams — all in one place.
            </p>
          </div>

          <p className="text-xs text-brand-200 mt-10 md:mt-0">
            Built for schools and coaching institutes
          </p>
        </div>

        {/* Right panel — role picker + form */}
        <div className="flex-1 p-8 sm:p-10">
          <p className="text-sm font-medium text-slate-700 mb-3">I'm logging in as</p>

          <div className="grid grid-cols-3 gap-2 mb-5">
            {ROLES.map((role) => {
              const Icon = role.icon;
              const isActive = role.key === selectedRole;
              return (
                <button
                  key={role.key}
                  type="button"
                  onClick={() => setSelectedRole(role.key)}
                  className={`flex flex-col items-center gap-1.5 rounded-lg border px-2 py-3 transition-colors ${
                    isActive
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <Icon size={18} />
                  <span className="text-xs font-medium">{role.label}</span>
                </button>
              );
            })}
          </div>

          <p className="text-xs text-slate-500 mb-5">{activeRole.note}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@institute.com"
              required
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <Button type="submit" loading={loading} className="w-full">
              Sign in
            </Button>
          </form>

          {selectedRole === 'super_admin' && (
            <p className="text-center text-sm text-slate-500 mt-5">
              New institute?{' '}
              <Link to="/register" className="font-medium text-brand-600 hover:text-brand-700">
                Register here
              </Link>
            </p>
          )}

          <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-slate-500">
            <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>
              Need help?{' '}
              <a
                href={`https://mail.google.com/mail/?view=cm&fs=1&to=${SUPPORT_EMAIL}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-brand-600 underline-offset-4 hover:underline break-all"
              >
                {SUPPORT_EMAIL}
              </a>
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
