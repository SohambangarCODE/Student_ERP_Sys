import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, BookOpen, Wallet, ClipboardCheck,
  GraduationCap, UserCog, Megaphone, Search, Bell, LogOut, ChevronDown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/students', label: 'Students', icon: Users },
  { to: '/batches', label: 'Batches', icon: BookOpen },
  { to: '/fees', label: 'Fees', icon: Wallet },
  { to: '/attendance', label: 'Attendance', icon: ClipboardCheck },
  { to: '/exams', label: 'Exams', icon: GraduationCap },
  { to: '/staff', label: 'Staff', icon: UserCog },
  { to: '/notices', label: 'Notices', icon: Megaphone },
];

function DashboardLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-slate-200 flex flex-col shrink-0">
        <div className="h-16 flex items-center gap-2 px-5 border-b border-slate-200">
          <div className="h-8 w-8 rounded-lg bg-brand-600 text-white font-bold text-sm flex items-center justify-center">
            E
          </div>
          <span className="font-semibold text-slate-900">ERP Suite</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                <Icon size={17} strokeWidth={2} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </aside>

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
          <div className="relative w-80">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search students, batches..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white transition-colors"
            />
          </div>

          <div className="flex items-center gap-4">
            <button className="relative text-slate-500 hover:text-slate-700">
              <Bell size={19} />
            </button>

            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2"
              >
                <div className="h-8 w-8 rounded-full bg-brand-100 text-brand-700 font-semibold text-sm flex items-center justify-center">
                  {user?.name?.charAt(0)}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-sm font-medium text-slate-900 leading-tight">{user?.name}</p>
                  <p className="text-xs text-slate-500 capitalize leading-tight">{user?.role?.replace('_', ' ')}</p>
                </div>
                <ChevronDown size={15} className="text-slate-400" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-white rounded-lg border border-slate-200 shadow-lg py-1 z-10">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
                  >
                    <LogOut size={15} />
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;