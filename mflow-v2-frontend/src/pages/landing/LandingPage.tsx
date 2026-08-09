import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import {
  ShoppingBag,
  Store,
  ShieldCheck,
  TrendingUp,
  Receipt,
  Users,
  CheckCircle2,
  ArrowRight,
  PackageCheck,
  CreditCard,
  PieChart,
  BarChart3,
  Lock,
  Zap,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Announcement Bar */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-center py-2 px-4 text-xs font-bold tracking-wide text-white">
        mFlow POS 2.0 Released: Real-time Multi-Shop Inventory, Customer Credit Ledger & Financial Reports!
      </div>

      {/* Navigation Header */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center font-black text-white text-lg shadow-lg shadow-indigo-600/30">
            mF
          </div>
          <span className="text-xl font-extrabold tracking-tight text-white">mFlow POS</span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-xs font-bold text-slate-300">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#solutions" className="hover:text-white transition-colors">Solutions</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          <a href="#security" className="hover:text-white transition-colors">Security</a>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/login">
            <Button variant="ghost" className="text-white hover:text-white hover:bg-slate-800">
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
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 text-center relative overflow-hidden">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold mb-8">
          <Zap className="w-3.5 h-3.5 text-indigo-400" /> High Performance Retail POS & ERP Engine
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight max-w-4xl mx-auto">
          The All-In-One POS & Inventory Engine for Modern Retail
        </h1>

        <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto mt-6 leading-relaxed font-medium">
          Accelerate cashier checkouts, manage real-time multi-branch stock transfers, track customer credit balances, and generate instant financial reports.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/register" className="w-full sm:w-auto">
            <Button size="lg" fullWidth icon={<ArrowRight className="w-5 h-5" />} iconPosition="right">
              Start Free 14-Day Trial
            </Button>
          </Link>
          <Link to="/login" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" fullWidth className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700">
              Sign In to POS Desk
            </Button>
          </Link>
        </div>

        {/* Feature Stat Highlights */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mt-16 text-left">
          <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/50">
            <h4 className="text-2xl font-black text-white">99.9%</h4>
            <p className="text-xs font-bold text-slate-400 mt-1">Uptime SLA Guaranteed</p>
          </div>
          <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/50">
            <h4 className="text-2xl font-black text-indigo-400">&lt; 1 sec</h4>
            <p className="text-xs font-bold text-slate-400 mt-1">Cashier Checkout Speed</p>
          </div>
          <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/50">
            <h4 className="text-2xl font-black text-white">Multi-Shop</h4>
            <p className="text-xs font-bold text-slate-400 mt-1">Stock Transfer Protocol</p>
          </div>
          <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/50">
            <h4 className="text-2xl font-black text-indigo-400">Automated</h4>
            <p className="text-xs font-bold text-slate-400 mt-1">P&L & Balance Sheets</p>
          </div>
        </div>
      </section>

      {/* Core Features Grid */}
      <section id="features" className="bg-slate-950 py-24 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <h2 className="text-xs font-black text-indigo-400 uppercase tracking-widest">Built for Speed & Reliability</h2>
            <h3 className="text-3xl font-extrabold text-white tracking-tight">Powerful Modules Engineered for Retail Success</h3>
            <p className="text-slate-400 text-sm font-medium">Everything your cashiers, store managers, and accountants need in one integrated workspace.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 hover:border-indigo-500/50 transition-all">
              <div className="w-12 h-12 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center mb-4">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-white">Fast POS Terminal</h4>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed font-medium">
                Instant barcode lookup, custom item pricing, split payment processing (Cash, M-Pesa, Card), and thermal receipt printing.
              </p>
            </div>

            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 hover:border-indigo-500/50 transition-all">
              <div className="w-12 h-12 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center mb-4">
                <Store className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-white">Multi-Branch Inventory</h4>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed font-medium">
                Track physical inventory stock levels per shop branch, log purchase orders, receive supplier stock, and initiate inter-shop transfers.
              </p>
            </div>

            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 hover:border-indigo-500/50 transition-all">
              <div className="w-12 h-12 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center mb-4">
                <CreditCard className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-white">Customer Credit Ledger</h4>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed font-medium">
                Manage customer debt accounts, issue credit receipts, record partial payments, and view outstanding credit balances.
              </p>
            </div>

            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 hover:border-indigo-500/50 transition-all">
              <div className="w-12 h-12 rounded-xl bg-amber-600/20 text-amber-400 flex items-center justify-center mb-4">
                <PieChart className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-white">Operating Expense Tracker</h4>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed font-medium">
                Categorize shop operational cash expenses, track recurring rent/salaries/utilities, and maintain outflow visibility.
              </p>
            </div>

            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 hover:border-indigo-500/50 transition-all">
              <div className="w-12 h-12 rounded-xl bg-rose-600/20 text-rose-400 flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-white">Financial Statements</h4>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed font-medium">
                Automated Statements of Profit & Loss, double-entry General Ledger bookkeeping, and balance sheet reporting.
              </p>
            </div>

            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 hover:border-indigo-500/50 transition-all">
              <div className="w-12 h-12 rounded-xl bg-cyan-600/20 text-cyan-400 flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-white">System Audit Trail</h4>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed font-medium">
                Role-based staff account controls, custom permission overrides (voiding sales, adjusting stock), and immutable audit logs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <h2 className="text-xs font-black text-indigo-400 uppercase tracking-widest">Transparent Pricing</h2>
          <h3 className="text-3xl font-extrabold text-white tracking-tight">Flexible Plans Tailored for Every Business Size</h3>
          <p className="text-slate-400 text-sm font-medium">No hidden transaction fees. Start your 14-day free trial today.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
          {/* Starter Plan */}
          <div className="bg-slate-800/40 p-8 rounded-3xl border border-slate-700/50 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase text-slate-400 tracking-wide">Single Shop</span>
              <h4 className="text-2xl font-bold text-white">Starter Plan</h4>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-white">KSh 2,500</span>
                <span className="text-xs text-slate-400 font-bold">/ month</span>
              </div>
              <p className="text-xs text-slate-400 font-medium">Ideal for single retail shops, boutiques, and pharmacies.</p>

              <ul className="space-y-3 pt-4 border-t border-slate-700/50 text-xs text-slate-300 font-medium">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> 1 Branch Shop Location</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Up to 3 Staff Accounts</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Full POS Checkout & Receipts</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Customer Credit Ledger</li>
              </ul>
            </div>
            <Link to="/register">
              <Button variant="outline" fullWidth className="bg-slate-700 hover:bg-slate-600 text-white border-slate-600">
                Start 14-Day Free Trial
              </Button>
            </Link>
          </div>

          {/* Professional Plan (Featured) */}
          <div className="bg-slate-800/90 p-8 rounded-3xl border-2 border-indigo-500 shadow-xl shadow-indigo-600/10 flex flex-col justify-between space-y-6 relative">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
              Most Popular
            </div>

            <div className="space-y-4">
              <span className="text-xs font-bold uppercase text-indigo-400 tracking-wide">Multi-Branch</span>
              <h4 className="text-2xl font-bold text-white">Professional Plan</h4>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-white">KSh 5,000</span>
                <span className="text-xs text-slate-400 font-bold">/ month</span>
              </div>
              <p className="text-xs text-slate-400 font-medium">Perfect for growing businesses with multiple branch locations.</p>

              <ul className="space-y-3 pt-4 border-t border-slate-700 text-xs text-slate-200 font-medium">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Up to 3 Branch Shop Locations</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Up to 10 Staff Cashier Accounts</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Inter-Shop Inventory Transfers</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Supplier Purchase Orders & Deliveries</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Profit & Loss Financial Reports</li>
              </ul>
            </div>
            <Link to="/register">
              <Button variant="primary" fullWidth size="md">
                Start 14-Day Free Trial
              </Button>
            </Link>
          </div>

          {/* Enterprise Plan */}
          <div className="bg-slate-800/40 p-8 rounded-3xl border border-slate-700/50 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase text-slate-400 tracking-wide">Unlimited Scale</span>
              <h4 className="text-2xl font-bold text-white">Enterprise Plan</h4>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-white">KSh 10,000</span>
                <span className="text-xs text-slate-400 font-bold">/ month</span>
              </div>
              <p className="text-xs text-slate-400 font-medium">Designed for large retail chains and franchises requiring full audit control.</p>

              <ul className="space-y-3 pt-4 border-t border-slate-700/50 text-xs text-slate-300 font-medium">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Unlimited Branch Locations</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Unlimited Staff Accounts</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Custom Permission Overrides</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Full Audit Trail & Security Logs</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Priority 24/7 Support</li>
              </ul>
            </div>
            <Link to="/register">
              <Button variant="outline" fullWidth className="bg-slate-700 hover:bg-slate-600 text-white border-slate-600">
                Start 14-Day Free Trial
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800 py-12 text-center text-xs text-slate-500 font-medium">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white text-xs">
              mF
            </div>
            <span className="font-bold text-slate-300 text-sm">mFlow POS</span>
          </div>
          <p>© 2026 mFlow POS. All rights reserved. Built for high-volume retail operations.</p>
          <div className="flex items-center gap-4 text-slate-400">
            <Link to="/login" className="hover:text-white transition-colors">Sign In</Link>
            <Link to="/register" className="hover:text-white transition-colors">Register Business</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
