import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Default to localhost / dev backend URL. Adjust to server domain or local IP (e.g. http://192.168.1.X:5000/api/v1) for phone testing
export const API_BASE_URL = 'https://api.mflowpos.com/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.error('Error fetching token from AsyncStorage', e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        await AsyncStorage.removeItem('auth_token');
        await AsyncStorage.removeItem('auth_user');
      } catch (e) {
        console.error('Error clearing storage on 401', e);
      }
    }
    return Promise.reject(error);
  }
);
