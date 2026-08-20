import { Routes, Route } from "react-router-dom";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Dashboard from "../pages/Dashboard";
import ProtectedRoute from "./ProtectedRoute";
import PublicRoute from "./PublicRoute";
import Students from "../pages/Students";
import Batches from "../pages/Batches";
import Fees from "../pages/Fees";
import Attendance from "../pages/Attendance";
import Exams from "../pages/Exams";
import Staff from "../pages/Staff";
import Notices from "../pages/Notices";
import ParentDashboard from "../pages/ParentDashboard";
import { useAuth } from "../context/AuthContext";
import MyFees from "../pages/MyFees";
import MyResults from "../pages/MyResults";
import MyAttendance from "../pages/MyAttendance";
import Messages from "../pages/Messages";
import MyMessages from "../pages/MyMessages";
import Settings from "../pages/Settings";

// A real, standalone function — defined here, OUTSIDE and ABOVE AppRoutes,
// not inside any JSX attribute. This is what was missing before.
function DashboardRouter() {
  const { user } = useAuth();
  return user?.role === "parent" ? <ParentDashboard /> : <Dashboard />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardRouter />
          </ProtectedRoute>
        }
      />

      <Route
        path="/students"
        element={
          <ProtectedRoute
            allowedRoles={[
              "super_admin",
              "branch_admin",
              "accountant",
              "teacher",
              "front_desk",
            ]}
          >
            <Students />
          </ProtectedRoute>
        }
      />
      <Route
        path="/batches"
        element={
          <ProtectedRoute
            allowedRoles={[
              "super_admin",
              "branch_admin",
              "accountant",
              "teacher",
              "front_desk",
            ]}
          >
            <Batches />
          </ProtectedRoute>
        }
      />
      <Route path="/fees" element={<ProtectedRoute allowedRoles={['super_admin', 'branch_admin', 'accountant', 'front_desk']}><Fees /></ProtectedRoute>} />
      <Route
        path="/attendance"
        element={
          <ProtectedRoute
            allowedRoles={["super_admin", "branch_admin", "teacher"]}
          >
            <Attendance />
          </ProtectedRoute>
        }
      />
      <Route
        path="/exams"
        element={
          <ProtectedRoute
            allowedRoles={["super_admin", "branch_admin", "teacher"]}
          >
            <Exams />
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff"
        element={
          <ProtectedRoute allowedRoles={["super_admin", "branch_admin"]}>
            <Staff />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notices"
        element={
          <ProtectedRoute>
            <Notices />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-fees"
        element={
          <ProtectedRoute allowedRoles={["parent"]}>
            <MyFees />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-results"
        element={
          <ProtectedRoute allowedRoles={["parent"]}>
            <MyResults />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-attendance"
        element={
          <ProtectedRoute allowedRoles={["parent"]}>
            <MyAttendance />
          </ProtectedRoute>
        }
      />
      <Route
        path="/messages"
        element={
          <ProtectedRoute
            allowedRoles={["super_admin", "branch_admin", "teacher"]}
          >
            <Messages />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-messages"
        element={
          <ProtectedRoute allowedRoles={["parent"]}>
            <MyMessages />
          </ProtectedRoute>
        }
      />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route
        path="*"
        element={
          <ProtectedRoute>
            <DashboardRouter />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default AppRoutes;
