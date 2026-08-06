import { createContext, useState, useContext } from 'react';
import axiosInstance from '../api/axiosInstance';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  // Initialize state from localStorage so a page refresh doesn't log the user out
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

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
    <AuthContext.Provider value={{ user, login, registerInstitute, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook — lets any component just call useAuth() instead of importing
// useContext + AuthContext separately every time
export function useAuth() {
  return useContext(AuthContext);
}