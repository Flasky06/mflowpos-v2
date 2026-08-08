import { create } from 'zustand';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'SHOP_ADMIN' | 'SALES_REP';
  businessId?: string;
  shopId?: string;
  customPermissions?: string[];
  business?: {
    id: string;
    name: string;
    currency: string;
  };
  shop?: {
    id: string;
    name: string;
    shopType: 'PRODUCTS_ONLY' | 'SERVICES_ONLY' | 'BOTH';
  };
}

interface AuthState {
  user: UserProfile | null;
  activeShopId: string | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: UserProfile, token: string, refreshToken?: string) => void;
  updateUser: (partialUser: Partial<UserProfile>) => void;
  setActiveShopId: (shopId: string) => void;
  logout: () => void;
  hasPermission: (permissionCode: string) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => {
  const initialUser = sessionStorage.getItem('mflow_user')
    ? JSON.parse(sessionStorage.getItem('mflow_user')!)
    : null;
  const initialToken = sessionStorage.getItem('mflow_access_token');
  const initialShopId = sessionStorage.getItem('mflow_active_shop_id') || initialUser?.shopId || null;

  return {
    user: initialUser,
    activeShopId: initialShopId,
    token: initialToken,
    isAuthenticated: !!initialToken && !!initialUser,

    setAuth: (user, token, refreshToken) => {
      sessionStorage.setItem('mflow_user', JSON.stringify(user));
      sessionStorage.setItem('mflow_access_token', token);
      if (refreshToken) {
        sessionStorage.setItem('mflow_refresh_token', refreshToken);
      }
      if (user.shopId) {
        sessionStorage.setItem('mflow_active_shop_id', user.shopId);
      }
      set({ user, token, isAuthenticated: true, activeShopId: user.shopId || get().activeShopId });
    },

    updateUser: (partialUser) => {
      const current = get().user;
      if (!current) return;
      const updated = { ...current, ...partialUser };
      sessionStorage.setItem('mflow_user', JSON.stringify(updated));
      set({ user: updated });
    },

    setActiveShopId: (shopId) => {
      sessionStorage.setItem('mflow_active_shop_id', shopId);
      set({ activeShopId: shopId });
    },

    logout: () => {
      sessionStorage.removeItem('mflow_user');
      sessionStorage.removeItem('mflow_access_token');
      sessionStorage.removeItem('mflow_refresh_token');
      sessionStorage.removeItem('mflow_active_shop_id');
      set({ user: null, token: null, isAuthenticated: false, activeShopId: null });
    },

    hasPermission: (permissionCode) => {
      const { user } = get();
      if (!user) return false;
      if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') return true;
      return user.customPermissions?.includes(permissionCode) || false;
    },
  };
});
