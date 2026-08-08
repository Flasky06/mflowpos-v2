import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { LogIn, Lock, Mail, Eye, EyeOff } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const addToast = useToastStore((state) => state.addToast);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      addToast({ type: 'warning', title: 'Missing fields', message: 'Please fill in both email and password' });
      return;
    }

    setIsLoading(true);
    try {
      const res = await apiClient.post('/auth/login', { email, password });
      const { user, tokens } = res.data.data;
      const accessToken = tokens?.accessToken || res.data.data?.accessToken;
      const refreshToken = tokens?.refreshToken;

      setAuth(user, accessToken, refreshToken);
      addToast({ type: 'success', title: 'Welcome back!', message: `Logged in as ${user.fullName}` });

      if (user.role === 'SUPER_ADMIN') {
        navigate('/superadmin');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to authenticate. Check email and password.';
      addToast({ type: 'error', title: 'Authentication Error', message: msg });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl relative border border-slate-200">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-4 font-black text-white text-xl shadow-md">
            mF
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Sign in to mFlow POS</h2>
          <p className="text-sm text-slate-500 mt-1">Enter your credentials to access your shop portal</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="manager@business.com"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl py-3 px-4 pl-11 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white text-sm"
              />
              <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl py-3 px-4 pl-11 pr-11 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white text-sm"
              />
              <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />

              {/* Password Visibility Toggle Button */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2 mt-6 active:scale-98 disabled:opacity-50"
          >
            <LogIn className="w-4 h-4" />
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 text-center pt-6 border-t border-slate-200">
          <p className="text-xs text-slate-500">
            Don't have a business account yet?{' '}
            <Link to="/register" className="text-indigo-600 font-semibold hover:underline">
              Register Business
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
