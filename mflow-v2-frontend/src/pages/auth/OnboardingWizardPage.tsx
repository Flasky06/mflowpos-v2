import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { Button } from '../../components/common/Button';
import { InputField } from '../../components/common/InputField';
import { SelectField } from '../../components/common/SelectField';
import {
  Building2,
  Store,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Zap,
} from 'lucide-react';

export const OnboardingWizardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();
  const addToast = useToastStore((state) => state.addToast);

  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Step 1: Business Details
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('RETAIL');
  const [address, setAddress] = useState('');

  // Step 2: Branch Setup & Plan
  const [shopName, setShopName] = useState('');
  const [shopType, setShopType] = useState('MAIN_STORE');
  const [preferredPlan, setPreferredPlan] = useState('STARTER');

  // Load cached progress
  useEffect(() => {
    const saved = sessionStorage.getItem('mflow-onboarding-progress');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.businessName) setBusinessName(parsed.businessName);
        if (parsed.businessType) setBusinessType(parsed.businessType);
        if (parsed.address) setAddress(parsed.address);
        if (parsed.shopName) setShopName(parsed.shopName);
        if (parsed.shopType) setShopType(parsed.shopType);
        if (parsed.preferredPlan) setPreferredPlan(parsed.preferredPlan);
      } catch (err) {
        console.error(err);
      }
    }
  }, []);

  // Cache progress
  useEffect(() => {
    const data = { businessName, businessType, address, shopName, shopType, preferredPlan };
    sessionStorage.setItem('mflow-onboarding-progress', JSON.stringify(data));
  }, [businessName, businessType, address, shopName, shopType, preferredPlan]);

  const handleNext = () => {
    setErrorMsg('');
    if (currentStep === 1) {
      if (!businessName.trim()) {
        setErrorMsg('Business name is required to continue');
        return;
      }
      setCurrentStep(2);
    }
  };

  const handleBack = () => {
    setErrorMsg('');
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!shopName.trim()) {
      setErrorMsg('Initial shop/branch name is required');
      return;
    }

    setIsLoading(true);
    try {
      // 1. Create Business (if not created during register)
      const busRes = await apiClient.post('/business', {
        name: businessName,
        businessType,
        address,
      });

      const newBusiness = busRes.data?.data;

      // 2. Create Initial Branch Shop
      const shopRes = await apiClient.post('/business/shops', {
        name: shopName,
        shopType,
        address,
      });

      const newShop = shopRes.data?.data;

      // 3. Update active user auth state
      if (user) {
        updateUser({
          businessId: newBusiness?.id || user.businessId,
          business: newBusiness || user.business,
          shopId: newShop?.id || user.shopId,
          shop: newShop || user.shop,
        });
      }

      sessionStorage.removeItem('mflow-onboarding-progress');
      addToast({
        type: 'success',
        title: 'Onboarding Complete',
        message: `Welcome to mFlow POS! '${businessName}' initialized.`,
      });

      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.message || 'Failed to complete onboarding. Please try again.';
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const totalSteps = 2;
  const progressPercent = (currentStep / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="w-full max-w-xl bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden relative">
        {/* Progress Top Bar */}
        <div className="w-full bg-slate-100 h-2">
          <div
            className="bg-indigo-600 h-2 transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-indigo-600 font-black tracking-tight text-xl">
              mflowpos.com
            </div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
              Step {currentStep} of {totalSteps}
            </span>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-semibold text-rose-700">
              {errorMsg}
            </div>
          )}

          {/* STEP 1: Business Profile */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Building2 className="w-6 h-6 text-indigo-600" />
                  Configure Business Profile
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Tell us about your business entity for receipts and billing invoices.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <InputField
                  label="Registered Business Name *"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Apex Retail Enterprises"
                />

                <SelectField
                  label="Primary Industry / Business Type *"
                  required
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  options={[
                    { value: 'RETAIL', label: 'General Retail Store' },
                    { value: 'PHARMACY', label: 'Pharmacy / Chemist' },
                    { value: 'ELECTRONICS', label: 'Electronics & Computers' },
                    { value: 'HARDWARE', label: 'Hardware & Building Supplies' },
                    { value: 'SUPERMARKET', label: 'Supermarket / Grocery' },
                    { value: 'BOUTIQUE', label: 'Fashion & Apparel Boutique' },
                    { value: 'AUTOMOTIVE', label: 'Auto Spares & Services' },
                  ]}
                />

                <InputField
                  label="Headquarters Physical Address / Town"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Kimathi Street, Nairobi"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end">
                <Button
                  variant="primary"
                  size="md"
                  icon={<ArrowRight className="w-4 h-4" />}
                  iconPosition="right"
                  onClick={handleNext}
                >
                  Continue to Branch Setup
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: Initial Branch & Plan Setup */}
          {currentStep === 2 && (
            <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in duration-150">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Store className="w-6 h-6 text-indigo-600" />
                  Initial Branch Shop Setup
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Create your first operational branch location for stock inventory and cashier POS.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <InputField
                  label="Initial Branch / Shop Name *"
                  required
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder={`e.g. ${businessName || 'Main'} - Main Store`}
                />

                <SelectField
                  label="Branch Classification *"
                  required
                  value={shopType}
                  onChange={(e) => setShopType(e.target.value)}
                  options={[
                    { value: 'MAIN_STORE', label: 'Main Store / Flagship Branch' },
                    { value: 'BRANCH', label: 'Retail Outlet Branch' },
                    { value: 'WAREHOUSE', label: 'Central Storage Warehouse' },
                  ]}
                />

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-900">mflow POS Standard Plan</p>
                      <p className="text-[11px] text-slate-500 font-medium">All features included · Unlimited shops & cashiers</p>
                    </div>
                    <span className="text-sm font-black text-indigo-600">KSh 1,000 <span className="text-[10px] font-bold text-slate-400">/ mo</span></span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-2xl flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <p className="text-xs text-indigo-950 font-medium">
                  Your 14-day free trial is automatically active. You can add more branches and invite cashiers anytime.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
                <Button variant="outline" type="button" icon={<ArrowLeft className="w-4 h-4" />} onClick={handleBack}>
                  Back
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isLoading}
                  icon={<CheckCircle2 className="w-4 h-4" />}
                >
                  Complete Onboarding
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
