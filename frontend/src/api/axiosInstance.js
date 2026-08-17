import axios from 'axios';

const axiosInstance = axios.create({
  // Relative URL works in both local dev (served by Express on :5000) and
  // production (served on the same Render domain). No env variable needed.
  baseURL: '/api',
});

// This runs before EVERY request made through this instance.
// It reads the token from localStorage and attaches it automatically —
// so no component or api file ever has to remember to add the header manually.
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// This runs on every RESPONSE. If the backend ever returns 401 (token invalid/expired),
// we clear storage and redirect to login — instead of every page having to handle this individually.
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;