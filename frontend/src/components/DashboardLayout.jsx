import { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Wallet,
  ClipboardCheck,
  GraduationCap,
  UserCog,
  Megaphone,
  Search,
  Bell,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Upload,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { MessageCircle } from "lucide-react";
import { SettingsIcon } from "lucide-react";
import { search } from "../api/searchApi";

const ALL_NAV_ITEMS = {
  overview: { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
  students: { to: "/students", label: "Students", icon: Users },
  batches: { to: "/batches", label: "Batches", icon: BookOpen },
  fees: { to: "/fees", label: "Fees", icon: Wallet },
  attendance: { to: "/attendance", label: "Attendance", icon: ClipboardCheck },
  exams: { to: "/exams", label: "Exams", icon: GraduationCap },
  staff: { to: "/staff", label: "Staff", icon: UserCog },
  notices: { to: "/notices", label: "Notices", icon: Megaphone },
  messages: { to: "/messages", label: "Messages", icon: MessageCircle },
  settings: { to: "/settings", label: "Settings", icon: SettingsIcon },
  myFees: { to: "/my-fees", label: "Pay Fees", icon: Wallet },
  myResults: { to: "/my-results", label: "Exam Results", icon: GraduationCap },
  myAttendance: {
    to: "/my-attendance",
    label: "Attendance History",
    icon: ClipboardCheck,
  },
  myMessages: { to: "/my-messages", label: "Messages", icon: MessageCircle },
};

// Each role sees exactly the modules they can actually use — mirrors the backend's restrictTo rules per module.
const NAV_BY_ROLE = {
  super_admin: [
    "overview",
    "students",
    "batches",
    "fees",
    "attendance",
    "exams",
    "staff",
    "notices",
    "messages",
    "settings",
  ],
  branch_admin: [
    "overview",
    "students",
    "batches",
    "fees",
    "attendance",
    "exams",
    "staff",
    "notices",
    "messages",
    "settings",
  ],
  accountant: ["overview", "fees", "notices", "settings"],
  teacher: [
    "overview",
    "students",
    "batches",
    "attendance",
    "exams",
    "notices",
    "messages",
    "settings",
  ],
  front_desk: ["overview", "students", "fees", "notices", "settings"],
  parent: [
    "overview",
    "myFees",
    "myResults",
    "myAttendance",
    "myMessages",
    "notices",
    "settings",
  ],
};

function DashboardLayout({ children }) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile drawer state

  const roleKeys = NAV_BY_ROLE[user?.role] || ["overview"];
  const visibleNavItems = roleKeys.map((key) => ALL_NAV_ITEMS[key]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleNavClick = () => setSidebarOpen(false); // close drawer after tapping a link

  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null); // null = no search yet, {} = has results
  const [searchOpen, setSearchOpen] = useState(false);
  const searchBoxRef = useRef(null);
  const navigate = useNavigate(); // reuse if already declared elsewhere in this file — don't duplicate

  // Debounce: wait 350ms after the user stops typing before actually calling the API.
  // Without this, every single keystroke would fire a request — wasteful and can even
  // show stale/out-of-order results if a fast typer outruns slow network responses.
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults(null);
      return;
    }
    const timer = setTimeout(() => {
      search(query).then((res) => setResults(res.data));
    }, 350);
    return () => clearTimeout(timer); // cancels the pending call if the user types again before 350ms passes
  }, [query]);

  // Close the results dropdown when clicking anywhere outside it
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const goToStudent = (student) => {
    setSearchOpen(false);
    setQuery("");
    navigate("/students", { state: { openStudentId: student._id } });
  };

  const goToBatch = (batch) => {
    setSearchOpen(false);
    setQuery("");
    navigate("/batches", { state: { openBatchId: batch._id } });
  };

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
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        <div className="h-16 flex items-center justify-between gap-2 px-5 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-brand-600 text-white font-bold text-sm flex items-center justify-center">
              E
            </div>
            <span className="font-semibold text-slate-900">ERP Suite</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-slate-400"
          >
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
                      ? "bg-brand-50 text-brand-700"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
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
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden text-slate-500 shrink-0"
            >
              <Menu size={22} />
            </button>

            {/* Search — hidden on very small screens, shown from sm: up */}
            {user?.role !== "parent" && (
              <div
                className="relative hidden sm:block w-full max-w-80"
                ref={searchBoxRef}
              >
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setSearchOpen(true);
                  }}
                  onFocus={() => setSearchOpen(true)}
                  placeholder="Search students, batches..."
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white transition-colors"
                />

                {searchOpen && results && (
                  <div className="absolute left-0 right-0 mt-2 bg-white rounded-lg border border-slate-200 shadow-lg max-h-80 overflow-y-auto z-20">
                    {results.students.length === 0 &&
                    results.batches.length === 0 ? (
                      <p className="text-sm text-slate-400 px-4 py-3">
                        No results found.
                      </p>
                    ) : (
                      <>
                        {results.students.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-slate-400 px-4 pt-3 pb-1 uppercase tracking-wide">
                              Students
                            </p>
                            {results.students.map((s) => (
                              <button
                                key={s._id}
                                onClick={() => goToStudent(s)}
                                className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center justify-between"
                              >
                                <span className="text-sm text-slate-900">
                                  {s.name}
                                </span>
                                <span className="text-xs text-slate-400">
                                  {s.admissionNumber}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                        {results.batches.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-slate-400 px-4 pt-3 pb-1 uppercase tracking-wide">
                              Batches
                            </p>
                            {results.batches.map((b) => (
                              <button
                                key={b._id}
                                onClick={() => goToBatch(b)}
                                className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm text-slate-900"
                              >
                                {b.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <button className="relative text-slate-500 hover:text-slate-700">
              <Bell size={19} />
            </button>

            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2"
              >
                <div className="h-8 w-8 rounded-full bg-brand-100 text-brand-700 font-semibold text-sm flex items-center justify-center shrink-0">
                  {user?.name?.charAt(0)}
                </div>
                <div className="text-left hidden md:block">
                  <p className="text-sm font-medium text-slate-900 leading-tight">
                    {user?.name}
                  </p>
                  <p className="text-xs text-slate-500 capitalize leading-tight">
                    {user?.role?.replace("_", " ")}
                  </p>
                </div>
                <ChevronDown
                  size={15}
                  className="text-slate-400 hidden md:block"
                />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-white rounded-lg border border-slate-200 shadow-lg py-1 z-10">
                  <div className="px-3 py-2 border-b border-slate-100 md:hidden">
                    <p className="text-sm font-medium text-slate-900">
                      {user?.name}
                    </p>
                    <p className="text-xs text-slate-500 capitalize">
                      {user?.role?.replace("_", " ")}
                    </p>
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
