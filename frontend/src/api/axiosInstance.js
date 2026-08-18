import axios from 'axios';

const axiosInstance = axios.create({
  // In local dev, hit the backend directly on its own port.
  // In production (Render), frontend and backend share one domain, so a relative
  // path correctly resolves to the same server — no separate env variable needed there.
  baseURL: import.meta.env.DEV ? 'http://localhost:5000/api' : '/api',
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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