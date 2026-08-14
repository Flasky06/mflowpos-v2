import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { Store, User, Mail, Lock, Phone, ArrowRight } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    businessName: '',
    fullName: '',
    email: '',
    password: '',
    phone: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const addToast = useToastStore((state) => state.addToast);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const payload = {
        businessName: formData.businessName,
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        phoneNumber: formData.phone,
      };

      await apiClient.post('/auth/register', payload);

      sessionStorage.setItem('mflow_pending_verify_email', formData.email);
      addToast({
        type: 'info',
        title: 'Confirmation Code Sent',
        message: `A 6-digit confirmation code was sent to ${formData.email}`,
      });

      navigate('/verify-email', { state: { email: formData.email } });
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to register business account.';
      addToast({ type: 'error', title: 'Registration Failed', message: msg });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="max-w-xl w-full bg-white p-8 rounded-3xl shadow-xl relative border border-slate-200">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-indigo-600 tracking-tight mb-2">mflowpos.com</h1>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Register Business Account</h2>
          <p className="text-xs text-slate-500 mt-1">Start your 14-day free trial with multi-branch capabilities</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Business Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="businessName"
                  required
                  value={formData.businessName}
                  onChange={handleChange}
                  placeholder="Metro Retailers"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl py-3 px-4 pl-11 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white text-sm"
                />
                <Store className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Full Name (Owner)
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="fullName"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl py-3 px-4 pl-11 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white text-sm"
                />
                <User className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="owner@metro.com"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl py-3 px-4 pl-11 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white text-sm"
                />
                <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Phone Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+254 712 345 678"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl py-3 px-4 pl-11 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white text-sm"
                />
                <Phone className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl py-3 px-4 pl-11 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white text-sm"
              />
              <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2 mt-6 active:scale-98 disabled:opacity-50"
          >
            {isLoading ? 'Creating Business...' : 'Create Business Account'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-8 text-center pt-6 border-t border-slate-200">
          <p className="text-xs text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-600 font-semibold hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
