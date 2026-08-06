import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout';

function Dashboard() {
  const { user } = useAuth();

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-semibold text-slate-900">
        Welcome back, {user?.name?.split(' ')[0]}
      </h1>
      <p className="text-sm text-slate-500 mt-1">Here's what's happening at your institute today.</p>

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-sm text-slate-500">Role</p>
          <p className="text-lg font-semibold text-slate-900 capitalize mt-1">
            {user?.role?.replace('_', ' ')}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-sm text-slate-500">Institute ID</p>
          <p className="text-sm font-mono text-slate-700 mt-1 truncate">{user?.instituteId}</p>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default Dashboard;