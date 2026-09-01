import { createContext, useState, useContext, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // loading = true until the server confirms (or rejects) the HttpOnly cookie.
  // No route should render before this resolves.
  const [loading, setLoading] = useState(true);

  // On every app mount, verify the HttpOnly cookie against the real server.
  // The cookie is sent automatically by the browser (withCredentials:true).
  // This prevents a logged-out (or expired-cookie) user from accessing
  // protected pages just by typing a URL or pressing the back button.
  useEffect(() => {
    axiosInstance
      .get('/auth/me', { withCredentials: true })
      .then((res) => {
        setUser(res.data.user);
      })
      .catch(() => {
        // Cookie is missing, invalid, or expired — user is not authenticated.
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []); // runs once on mount

  const login = async (email, password) => {
    const response = await axiosInstance.post('/auth/login', { email, password });
    // Server sets the HttpOnly 'token' cookie in the response — we never see it.
    // We only receive the non-sensitive user metadata.
    const { user: userData } = response.data;
    setUser(userData);
    return userData;
  };

  const registerInstitute = async (instituteName, adminName, email, password) => {
    const response = await axiosInstance.post('/auth/register-institute', {
      instituteName,
      adminName,
      email,
      password,
    });
    // Server sets the HttpOnly 'token' cookie in the response — we never see it.
    const { user: userData } = response.data;
    setUser(userData);
    return userData;
  };

  const logout = async () => {
    try {
      // Ask the server to clear the HttpOnly cookie — we cannot do it from JS.
      await axiosInstance.post('/auth/logout');
    } catch {
      // Even if the request fails, clear the local user state so the UI resets.
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, registerInstitute, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook — lets any component just call useAuth() instead of importing
// useContext + AuthContext separately every time
export function useAuth() {
  return useContext(AuthContext);
}
