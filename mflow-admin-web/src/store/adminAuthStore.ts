import { create } from 'zustand';

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: 'SUPER_ADMIN' | 'ADMIN';
}

interface AdminAuthState {
  user: AdminUser | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: AdminUser, token: string) => void;
  logout: () => void;
}

export const useAdminAuthStore = create<AdminAuthState>((set) => {
  const initialUser = sessionStorage.getItem('mflow_admin_user')
    ? JSON.parse(sessionStorage.getItem('mflow_admin_user')!)
    : null;
  const initialToken = sessionStorage.getItem('mflow_admin_access_token');

  return {
    user: initialUser,
    token: initialToken,
    isAuthenticated: !!initialToken && !!initialUser,

    setAuth: (user, token) => {
      sessionStorage.setItem('mflow_admin_user', JSON.stringify(user));
      sessionStorage.setItem('mflow_admin_access_token', token);
      set({ user, token, isAuthenticated: true });
    },

    logout: () => {
      sessionStorage.removeItem('mflow_admin_user');
      sessionStorage.removeItem('mflow_admin_access_token');
      set({ user: null, token: null, isAuthenticated: false });
    },
  };
});
