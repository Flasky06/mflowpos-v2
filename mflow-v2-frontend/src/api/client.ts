import axios from 'axios';

const envUrl = (import.meta as any).env?.VITE_API_URL || (import.meta as any).env?.VITE_API_BASE_URL;
const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const API_BASE_URL = envUrl || (isLocalhost ? 'http://localhost:8080/api/v1' : 'https://api.mflowpos.com/api/v1');

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Event bus listeners for Paywall & Auth events
export const PAYWALL_EVENT = 'MFLOW_PAYWALL_TRIGGERED';
export const AUTH_SUSPENDED_EVENT = 'MFLOW_USER_SUSPENDED';

apiClient.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('mflow_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 402 Payment Required (Paywall Expired)
    if (error.response?.status === 402) {
      window.dispatchEvent(
        new CustomEvent(PAYWALL_EVENT, {
          detail: error.response.data || { message: 'Subscription expired. Payment required.' },
        })
      );
      return Promise.reject(error);
    }

    // Handle 403 Forbidden Account Suspension
    if (error.response?.status === 403) {
      const msg = error.response.data?.message || '';
      if (msg.includes('suspended')) {
        window.dispatchEvent(
          new CustomEvent(AUTH_SUSPENDED_EVENT, { detail: { message: msg } })
        );
      }
    }

    // Handle 401 Automatic Token Refresh
    const isAuthRoute = originalRequest.url?.includes('/auth/');
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
      originalRequest._retry = true;
      try {
        const storedRefreshToken = sessionStorage.getItem('mflow_refresh_token');

        const refreshRes = await axios.post(
          `${API_BASE_URL}/auth/refresh-token`,
          { refreshToken: storedRefreshToken },
          {
            withCredentials: true,
            headers: {
              'Content-Type': 'application/json',
              ...(storedRefreshToken ? { 'x-refresh-token': storedRefreshToken } : {}),
            },
          }
        );

        const newToken = refreshRes.data.data?.accessToken;

        if (newToken) {
          sessionStorage.setItem('mflow_access_token', newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshErr) {
        sessionStorage.removeItem('mflow_access_token');
        sessionStorage.removeItem('mflow_refresh_token');
        sessionStorage.removeItem('mflow_user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);
