import axios from 'axios';

const axiosInstance = axios.create({
  // In local dev, hit the backend directly on its own port.
  // In production (Render), frontend and backend share one domain, so a relative
  // path correctly resolves to the same server — no separate env variable needed there.
  baseURL: import.meta.env.DEV ? 'http://localhost:5000/api' : '/api',

  // Required for the browser to send HttpOnly cookies on cross-origin requests
  // (dev: localhost:5173 → localhost:5000). Has no effect in same-origin prod.
  withCredentials: true,
});

// No request interceptor needed — the browser automatically attaches the HttpOnly
// 'token' cookie to every request. Nothing here can or should touch it.

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Do NOT redirect on /auth/me — it legitimately returns 401 when there's
      // no cookie (unauthenticated user). AuthContext's .catch() already handles
      // it by setting user to null. Redirecting here would cause an infinite loop:
      //   mount → /auth/me → 401 → redirect /login → reload → mount → repeat …
      // Only redirect on 401 from other protected endpoints (cookie expired mid-session).
      const url = error.config?.url || '';
      if (!url.includes('/auth/me')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;