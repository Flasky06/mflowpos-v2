import axios from 'axios';

// Safely resolve Production API Base URL (Hetzner VPS + Cloudflare Tunnel)
const getApiBaseUrl = () => {
  const envVal = (import.meta as any).env?.VITE_API_BASE_URL || (import.meta as any).env?.VITE_API_URL;
  if (envVal && typeof envVal === 'string' && (envVal.startsWith('http://') || envVal.startsWith('https://'))) {
    return envVal;
  }
  return 'https://api.mflowpos.com/api/v1';
};

const API_BASE_URL = getApiBaseUrl();

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

    // Handle 401 Unauthorized (Expired Access Token -> Auto Refresh)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = sessionStorage.getItem('mflow_refresh_token');

      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE_URL}/auth/refresh-token`, { refreshToken });
          const newAccessToken = res.data?.data?.accessToken;
          if (newAccessToken) {
            sessionStorage.setItem('mflow_access_token', newAccessToken);
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return apiClient(originalRequest);
          }
        } catch (refreshErr) {
          sessionStorage.removeItem('mflow_access_token');
          sessionStorage.removeItem('mflow_refresh_token');
          sessionStorage.removeItem('mflow_user');
          window.location.href = '/login';
          return Promise.reject(refreshErr);
        }
      }
    }

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
    if (error.response?.status === 403 && error.response?.data?.message?.includes('suspended')) {
      window.dispatchEvent(
        new CustomEvent(AUTH_SUSPENDED_EVENT, {
          detail: error.response.data || { message: 'Business account is suspended.' },
        })
      );
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);
