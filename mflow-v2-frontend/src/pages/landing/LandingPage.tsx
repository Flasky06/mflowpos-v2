import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import {
  ShoppingBag,
  Store,
  ShieldCheck,
  Receipt,
  CheckCircle2,
  ArrowRight,
  CreditCard,
  PieChart,
  BarChart3,
  Zap,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-600 selection:text-white">
      {/* Top Announcement Bar */}
      <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-600 text-center py-2 px-4 text-xs font-bold tracking-wide text-white shadow-xs">
        mFlow POS 2.0 Released: Real-time Multi-Shop Inventory, Customer Credit Ledger & Financial Reports!
      </div>

      {/* Navigation Header */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="flex items-center gap-3">
          <span className="text-xl font-black tracking-tight text-slate-900">mflowpos.com</span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-xs font-bold text-slate-600">
          <a href="#features" className="hover:text-indigo-600 transition-colors">Features</a>
          <a href="#pricing" className="hover:text-indigo-600 transition-colors">Pricing</a>
          <a href="#security" className="hover:text-indigo-600 transition-colors">Security</a>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/login">
            <Button variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-100">
              Sign In
            </Button>
          </Link>
          <Link to="/register">
            <Button variant="primary" icon={<ArrowRight className="w-4 h-4" />} iconPosition="right">
              Get Started Free
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-white via-indigo-50/30 to-slate-50 pt-16 pb-20 border-b border-slate-200 text-center relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-extrabold mb-6 shadow-2xs">
            <Zap className="w-3.5 h-3.5 text-indigo-600" /> High Performance Retail POS & ERP Engine
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-tight max-w-4xl mx-auto">
            The All-In-One POS & Inventory Engine for Modern Retail
          </h1>

          <p className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto mt-6 leading-relaxed font-medium">
            Accelerate cashier checkouts, manage real-time multi-branch stock transfers, track customer credit balances, and generate instant financial reports.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register" className="w-full sm:w-auto">
              <Button size="lg" fullWidth icon={<ArrowRight className="w-5 h-5" />} iconPosition="right">
                Start Free 14-Day Trial
              </Button>
            </Link>
            <Link to="/login" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" fullWidth className="bg-white border-slate-300 text-slate-800 hover:bg-slate-100 shadow-xs">
                Sign In to POS Desk
              </Button>
            </Link>
          </div>

          {/* Feature Stat Highlights */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mt-14 text-left">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <h4 className="text-2xl font-black text-slate-900">99.9%</h4>
              <p className="text-xs font-bold text-slate-500 mt-1">Uptime SLA Guaranteed</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <h4 className="text-2xl font-black text-indigo-600">&lt; 1 sec</h4>
              <p className="text-xs font-bold text-slate-500 mt-1">Cashier Checkout Speed</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <h4 className="text-2xl font-black text-slate-900">Multi-Shop</h4>
              <p className="text-xs font-bold text-slate-500 mt-1">Stock Transfer Protocol</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <h4 className="text-2xl font-black text-indigo-600">Automated</h4>
              <p className="text-xs font-bold text-slate-500 mt-1">P&L & Balance Sheets</p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Grid */}
      <section id="features" className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-2">
            <h2 className="text-xs font-black text-indigo-600 uppercase tracking-widest">Built for Speed & Reliability</h2>
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">Powerful Modules Engineered for Retail Success</h3>
            <p className="text-slate-600 text-sm font-medium">Everything your cashiers, store managers, and accountants need in one integrated workspace.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-14">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 hover:border-indigo-500/50 hover:bg-white transition-all shadow-2xs">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">Fast POS Terminal</h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed font-medium">
                Instant barcode lookup, custom item pricing, split payment processing (Cash, M-Pesa, Card), and thermal receipt printing.
              </p>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 hover:border-indigo-500/50 hover:bg-white transition-all shadow-2xs">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-4">
                <Store className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">Multi-Branch Inventory</h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed font-medium">
                Track physical inventory stock levels per shop branch, log purchase orders, receive supplier stock, and initiate inter-shop transfers.
              </p>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 hover:border-indigo-500/50 hover:bg-white transition-all shadow-2xs">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
                <CreditCard className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">Customer Credit Ledger</h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed font-medium">
                Manage customer debt accounts, issue credit receipts, record partial payments, and view outstanding credit balances.
              </p>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 hover:border-indigo-500/50 hover:bg-white transition-all shadow-2xs">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
                <PieChart className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">Operating Expense Tracker</h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed font-medium">
                Categorize shop operational cash expenses, track recurring rent/salaries/utilities, and maintain outflow visibility.
              </p>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 hover:border-indigo-500/50 hover:bg-white transition-all shadow-2xs">
              <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">Financial Statements</h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed font-medium">
                Automated Statements of Profit & Loss, double-entry General Ledger bookkeeping, and balance sheet reporting.
              </p>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 hover:border-indigo-500/50 hover:bg-white transition-all shadow-2xs">
              <div className="w-12 h-12 rounded-xl bg-cyan-100 text-cyan-600 flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">System Audit Trail</h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed font-medium">
                Role-based staff account controls, custom permission overrides (voiding sales, adjusting stock), and immutable audit logs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section (Configured Seed Prices) */}
      <section id="pricing" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <h2 className="text-xs font-black text-indigo-600 uppercase tracking-widest">Simple & Transparent Pricing</h2>
          <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">Flexible Subscription Plans Tailored for Your Business</h3>
          <p className="text-slate-600 text-sm font-medium">No hidden transaction fees. Start your 14-day free trial today.</p>
        </div>

        <div className="max-w-2xl mx-auto mt-14">
          {/* All-in-One Flat Plan */}
          <div className="bg-white p-8 sm:p-10 rounded-3xl border-2 border-indigo-600 shadow-xl shadow-indigo-600/10 flex flex-col justify-between space-y-8 relative">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-4 py-1 rounded-full text-[11px] font-black uppercase tracking-widest shadow-sm">
              All Features Included
            </div>

            <div className="space-y-4 text-center">
              <span className="text-xs font-bold uppercase text-indigo-600 tracking-wide">Simple Flat Subscription</span>
              <h4 className="text-3xl font-extrabold text-slate-900">mflow POS Standard</h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-6 border-t border-slate-200 text-xs text-slate-800 font-semibold text-left">
                <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Unlimited Branch Shop Locations</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Unlimited Staff & Cashier Accounts</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Thermal Receipts & Barcode Scanner</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Multi-Branch Stock & Transfers</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Customer Credit & Ledger Tracking</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Supplier Purchase Orders & Deliveries</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Profit & Loss Financial Reports</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Complete Audit Trail & Activity Logs</div>
              </div>
            </div>

            <Link to="/register" className="block">
              <Button variant="primary" fullWidth size="lg" className="py-3.5 text-sm font-bold shadow-md shadow-indigo-600/20">
                Start 14-Day Free Trial
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-10 text-center text-xs text-slate-500 font-medium">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-900 text-sm">mflowpos.com</span>
          </div>
          <p>© 2026 mFlow POS. All rights reserved. Built for high-volume retail operations.</p>
          <div className="flex items-center gap-4 text-slate-600">
            <Link to="/login" className="hover:text-indigo-600 transition-colors">Sign In</Link>
            <Link to="/register" className="hover:text-indigo-600 transition-colors">Register Business</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
