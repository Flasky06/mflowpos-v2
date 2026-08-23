import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../api/client';

interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  businessId: string;
  businessName?: string;
  subscriptionPlan?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  shops: any[];
  activeShopId: string | null;
  isLoading: boolean;
  isInitializing: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  setActiveShopId: (shopId: string) => Promise<void>;
  loadStoredAuth: () => Promise<void>;
  fetchUserShops: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  shops: [],
  activeShopId: null,
  isLoading: false,
  isInitializing: true,

  loadStoredAuth: async () => {
    try {
      const storedToken = await AsyncStorage.getItem('auth_token');
      const storedUser = await AsyncStorage.getItem('auth_user');
      const storedShopId = await AsyncStorage.getItem('active_shop_id');

      if (storedToken && storedUser) {
        const userObj = JSON.parse(storedUser);
        set({
          token: storedToken,
          user: userObj,
          activeShopId: storedShopId || null,
        });
        await get().fetchUserShops();
      }
    } catch (e) {
      console.error('Failed to load stored auth session:', e);
    } finally {
      set({ isInitializing: false });
    }
  },

  login: async (email: string, pass: string) => {
    set({ isLoading: true });
    try {
      const response = await apiClient.post('/auth/login', {
        email: email.trim(),
        password: pass,
      });

      const { user, token, shopId } = response.data.data;
      const initialShopId = shopId || null;

      await AsyncStorage.setItem('auth_token', token);
      await AsyncStorage.setItem('auth_user', JSON.stringify(user));
      if (initialShopId) {
        await AsyncStorage.setItem('active_shop_id', initialShopId);
      }

      set({
        user,
        token,
        activeShopId: initialShopId,
        isLoading: false,
      });

      await get().fetchUserShops();
    } catch (error: any) {
      set({ isLoading: false });
      const msg = error.response?.data?.message || 'Login failed. Please check credentials.';
      throw new Error(msg);
    }
  },

  logout: async () => {
    try {
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('auth_user');
      await AsyncStorage.removeItem('active_shop_id');
    } catch (e) {
      console.error('Logout cleanup error:', e);
    }
    set({ user: null, token: null, activeShopId: null, shops: [] });
  },

  setActiveShopId: async (shopId: string) => {
    try {
      await AsyncStorage.setItem('active_shop_id', shopId);
      set({ activeShopId: shopId });
    } catch (e) {
      console.error('Error saving active shop ID:', e);
    }
  },

  fetchUserShops: async () => {
    try {
      const res = await apiClient.get('/business/shops');
      const shopList = res.data?.data || [];
      set({ shops: shopList });
      if (shopList.length > 0 && !get().activeShopId) {
        await get().setActiveShopId(shopList[0].id);
      }
    } catch (e) {
      console.error('Failed to fetch shop list:', e);
    }
  },
}));
