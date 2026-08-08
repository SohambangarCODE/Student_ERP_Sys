import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, BookOpen, Wallet, ClipboardCheck,
  GraduationCap, UserCog, Megaphone, Search, Bell, LogOut, ChevronDown, Menu, X,
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
  { to: '/messages', label: 'Messages', icon: MessageCircle },
];

const parentNavItems = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/my-fees', label: 'Pay Fees', icon: Wallet },
  { to: '/my-results', label: 'Exam Results', icon: GraduationCap },
  { to: '/my-attendance', label: 'Attendance History', icon: ClipboardCheck },
  { to: '/notices', label: 'Notices', icon: Megaphone },
  { to: '/my-messages', label: 'Messages', icon: MessageCircle },
];


function DashboardLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile drawer state

const isParent = user?.role === 'parent';
const visibleNavItems = isParent ? parentNavItems : navItems;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNavClick = () => setSidebarOpen(false); // close drawer after tapping a link

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile overlay — dims background, tapping it closes the drawer */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — fixed drawer on mobile (slides in/out), normal flow on desktop */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 md:w-60 bg-white border-r border-slate-200 flex flex-col shrink-0
          transform transition-transform duration-200 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
      >
        <div className="h-16 flex items-center justify-between gap-2 px-5 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-brand-600 text-white font-bold text-sm flex items-center justify-center">
              E
            </div>
            <span className="font-semibold text-slate-900">ERP Suite</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-slate-400">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={handleNavClick}
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
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 shrink-0">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden text-slate-500 shrink-0">
              <Menu size={22} />
            </button>

            {/* Search — hidden on very small screens, shown from sm: up */}
            <div className="relative hidden sm:block w-full max-w-80">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search students, batches..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <button className="relative text-slate-500 hover:text-slate-700">
              <Bell size={19} />
            </button>

            <div className="relative">
              <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-brand-100 text-brand-700 font-semibold text-sm flex items-center justify-center shrink-0">
                  {user?.name?.charAt(0)}
                </div>
                <div className="text-left hidden md:block">
                  <p className="text-sm font-medium text-slate-900 leading-tight">{user?.name}</p>
                  <p className="text-xs text-slate-500 capitalize leading-tight">{user?.role?.replace('_', ' ')}</p>
                </div>
                <ChevronDown size={15} className="text-slate-400 hidden md:block" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-white rounded-lg border border-slate-200 shadow-lg py-1 z-10">
                  <div className="px-3 py-2 border-b border-slate-100 md:hidden">
                    <p className="text-sm font-medium text-slate-900">{user?.name}</p>
                    <p className="text-xs text-slate-500 capitalize">{user?.role?.replace('_', ' ')}</p>
                  </div>
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
          <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;