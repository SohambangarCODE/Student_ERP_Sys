import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * PublicRoute — wraps pages that should only be visible to unauthenticated users
 * (e.g. /login, /register).
 *
 * If the user is already logged in (confirmed by the server token-check),
 * redirect them straight to /dashboard so they can never reach the login
 * screen by hitting the back button or editing the URL bar.
 */
function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  // Wait for the server token-check before deciding.
  if (loading) {
    return null;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default PublicRoute;
