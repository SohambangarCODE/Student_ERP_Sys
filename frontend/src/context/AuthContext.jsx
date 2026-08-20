import { createContext, useState, useContext, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // loading = true until the server confirms (or rejects) the stored token.
  // No route should render before this resolves.
  const [loading, setLoading] = useState(true);

  // On every app mount, verify the stored JWT against the real server.
  // This prevents a logged-out (or expired-token) user from accessing
  // protected pages just by typing a URL or pressing the back button.
  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      // No token at all — definitely not logged in
      setLoading(false);
      return;
    }

    axiosInstance
      .get('/auth/me')
      .then((res) => {
        const userData = res.data.user;
        // Refresh localStorage with the latest server-side user data
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
      })
      .catch(() => {
        // Token is invalid or expired — wipe everything so the user is fully logged out
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []); // runs once on mount

  const login = async (email, password) => {
    const response = await axiosInstance.post('/auth/login', { email, password });
    const { token, user: userData } = response.data;

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
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
    const { token, user: userData } = response.data;

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);

    return userData;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
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