import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import {
  ShoppingCart,
  CheckCircle2,
  Trash2,
  Minus,
  Plus,
  X,
  Tag,
  ArrowLeft,
  UserCheck,
} from 'lucide-react';

export interface CartItem {
  productId?: string;
  serviceId?: string;
  name: string;
  type: 'PRODUCT' | 'SERVICE';
  quantity: number;
  unitPrice: number;
  discount?: number;
  itemRef?: any;
}

interface CartModalProps {
  isCartModalOpen: boolean;
  isCheckoutModalOpen: boolean;
  cart: CartItem[];
  customers: any[];
  selectedCustomer: string;
  paymentMethod: string;
  globalDiscount: number;
  isCheckoutLoading: boolean;
  onCloseCartModal: () => void;
  onCloseCheckoutModal: () => void;
  onOpenCheckoutModal: () => void;
  onOpenCartModal: () => void;
  onUpdateQuantity: (index: number, delta: number) => void;
  onUpdateItemDiscount: (index: number, discountAmount: number) => void;
  onRemoveFromCart: (index: number) => void;
  onSetSelectedCustomer: (customer: string) => void;
  onSetPaymentMethod: (method: string) => void;
  onSetGlobalDiscount: (discount: number) => void;
  onCompleteCheckout: () => void;
}

export const CartModal: React.FC<CartModalProps> = ({
  isCartModalOpen,
  isCheckoutModalOpen,
  cart,
  customers,
  selectedCustomer,
  paymentMethod,
  globalDiscount,
  isCheckoutLoading,
  onCloseCartModal,
  onCloseCheckoutModal,
  onOpenCheckoutModal,
  onOpenCartModal,
  onUpdateQuantity,
  onUpdateItemDiscount,
  onRemoveFromCart,
  onSetSelectedCustomer,
  onSetPaymentMethod,
  onSetGlobalDiscount,
  onCompleteCheckout,
}) => {
  const [fetchedAccounts, setFetchedAccounts] = useState<any[]>([]);

  useEffect(() => {
    if (isCheckoutModalOpen) {
      apiClient
        .get('/payment-accounts')
        .then((res) => {
          const list = res.data?.data || [];
          setFetchedAccounts(list);
          if (list.length > 0 && !paymentMethod) {
            const defaultAcc = list.find((a: any) => a.isDefault) || list[0];
            onSetPaymentMethod(defaultAcc.name);
          }
        })
        .catch((err) => console.error(err));
    }
  }, [isCheckoutModalOpen]);

  const cartSubtotal = cart.reduce((sum, i) => {
    const effectiveUnitPrice = Math.max(0, i.unitPrice - (i.discount || 0));
    return sum + i.quantity * effectiveUnitPrice;
  }, 0);

  const totalPayableAmount = Math.max(0, cartSubtotal - (globalDiscount || 0));
  const totalItemCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <>
      {/* STEP 1 MODAL: Current Sale Cart */}
      {isCartModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="max-w-2xl w-full bg-white p-6 rounded-2xl border border-slate-200 shadow-xl relative flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-bold text-slate-900">Current Sale Cart</h3>
              </div>
              <button
                onClick={onCloseCartModal}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items Table */}
            <div className="flex-1 overflow-y-auto my-4 border border-slate-200 rounded-xl">
              {cart.length === 0 ? (
                <div className="py-16 text-center text-slate-400">
                  <ShoppingCart className="w-12 h-12 stroke-1 mb-2 mx-auto opacity-50" />
                  <p className="text-sm font-medium text-slate-600">No items added to cart.</p>
                </div>
              ) : (
                <table className="w-full text-left text-sm text-slate-700">
                  <thead className="text-xs uppercase bg-slate-100 text-slate-600 border-b border-slate-200 sticky top-0">
                    <tr>
                      <th className="py-3 px-4">Item</th>
                      <th className="py-3 px-4 text-center">Unit Price</th>
                      <th className="py-3 px-4 text-center">Discount</th>
                      <th className="py-3 px-4 text-center">Qty</th>
                      <th className="py-3 px-4 text-right">Total</th>
                      <th className="py-3 px-4 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {cart.map((item, idx) => {
                      const effectiveUnit = Math.max(0, item.unitPrice - (item.discount || 0));
                      const itemLineTotal = item.quantity * effectiveUnit;

                      return (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-3 px-4 font-semibold text-slate-900">
                            {item.name}
                            {item.type === 'SERVICE' && (
                              <span className="ml-2 px-2 py-0.5 text-[10px] uppercase font-bold text-violet-700 bg-violet-50 border border-violet-200 rounded-full">
                                Service
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center font-mono text-xs text-slate-600">
                            {item.unitPrice.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={item.discount || ''}
                              onChange={(e) => onUpdateItemDiscount(idx, parseFloat(e.target.value))}
                              placeholder="0"
                              className="w-20 text-center border border-slate-300 rounded-lg p-1 text-xs font-bold focus:outline-none focus:border-indigo-600"
                            />
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="inline-flex items-center border border-slate-300 rounded-lg bg-white">
                              <button
                                onClick={() => onUpdateQuantity(idx, -1)}
                                className="px-2 py-1 hover:bg-slate-100 text-slate-700 font-bold border-r border-slate-200"
                              >
                                -
                              </button>
                              <span className="px-3 text-xs font-bold">{item.quantity}</span>
                              <button
                                onClick={() => onUpdateQuantity(idx, 1)}
                                className="px-2 py-1 hover:bg-slate-100 text-slate-700 font-bold border-l border-slate-200"
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-slate-900">
                            KES {itemLineTotal.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => onRemoveFromCart(idx)}
                              className="text-slate-400 hover:text-rose-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Step 1 Footer */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div>
                <span className="text-xs text-slate-500 font-semibold uppercase block">Cart Subtotal</span>
                <span className="text-2xl font-extrabold text-slate-900">KES {cartSubtotal.toLocaleString()}</span>
              </div>

              <div className="flex gap-3 w-full sm:w-auto">
                <button
                  onClick={onCloseCartModal}
                  className="px-5 py-2.5 border border-slate-300 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  disabled={cart.length === 0}
                  onClick={onOpenCheckoutModal}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-md disabled:opacity-50"
                >
                  Process Sale & Checkout →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2 MODAL: Finalize Sale Modal */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="max-w-xl w-full bg-white p-6 rounded-2xl border border-slate-200 shadow-xl relative flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="text-lg font-bold text-slate-900">Finalize Sale & Payment</h3>
              </div>
              <button
                onClick={onCloseCheckoutModal}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5 my-4 overflow-y-auto pr-1">
              {/* Total to Pay Banner */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-center space-y-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Total to Pay</span>
                <span className="text-3xl font-extrabold text-indigo-600 block">
                  KES {totalPayableAmount.toLocaleString()}
                </span>
                <span className="text-xs text-slate-400 font-semibold block">{totalItemCount} Items in Sale</span>
              </div>

              {/* Total Cart Discount Input */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Full Cart Discount (KES)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={globalDiscount || ''}
                    onChange={(e) => onSetGlobalDiscount(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2.5 px-3 pl-9 text-slate-900 text-sm font-bold focus:outline-none focus:border-indigo-600"
                  />
                  <Tag className="w-4 h-4 text-indigo-600 absolute left-3 top-3" />
                </div>
              </div>

              {/* Account To / Payment Method Cards Grid */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                  Select Payment Account
                </label>
                <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-1">
                  {(fetchedAccounts.length > 0
                    ? fetchedAccounts
                    : [
                        { id: 'CASH', name: 'Cash Account', type: 'CASH', accountNumber: null },
                        { id: 'CARD', name: 'Card / POS Terminal', type: 'CARD', accountNumber: null },
                        { id: 'MPESA', name: 'M-Pesa Express', type: 'MPESA', accountNumber: 'Paybill / Till' },
                        { id: 'CREDIT', name: 'Customer Credit', type: 'CREDIT', accountNumber: null },
                      ]
                  ).map((acc: any) => {
                    const accValue = acc.name || acc.id;
                    const isSelected =
                      paymentMethod === accValue ||
                      paymentMethod === acc.type ||
                      paymentMethod === acc.id;
                    return (
                      <button
                        key={acc.id || acc.name}
                        type="button"
                        onClick={() => onSetPaymentMethod(accValue)}
                        className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 shadow-xs font-bold'
                            : 'border-slate-200 hover:border-slate-300 bg-slate-50/40 text-slate-600 font-semibold'
                        }`}
                      >
                        <span className="font-bold text-xs text-center">{acc.name}</span>
                        {acc.accountNumber && (
                          <span className="text-[10px] bg-indigo-100 text-indigo-800 font-mono font-semibold px-2 py-0.5 rounded-md">
                            {acc.accountNumber}
                          </span>
                        )}
                        <span className="text-[9px] text-slate-400 font-mono uppercase">{acc.type || acc.id}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Customer Selection */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Customer (Optional)
                </label>
                <div className="relative">
                  <select
                    value={selectedCustomer}
                    onChange={(e) => onSetSelectedCustomer(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs font-semibold rounded-xl py-2.5 px-3 pl-9 focus:outline-none focus:border-indigo-600"
                  >
                    <option value="">Walk-in Customer</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.phone || 'No Phone'})
                      </option>
                    ))}
                  </select>
                  <UserCheck className="w-4 h-4 text-indigo-600 absolute left-3 top-3" />
                </div>
              </div>
            </div>

            {/* Step 2 Actions Footer */}
            <div className="pt-4 border-t border-slate-200 flex gap-3">
              <button
                type="button"
                onClick={onOpenCartModal}
                className="px-4 py-3 border border-slate-300 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-50 transition-all flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>

              <button
                type="button"
                onClick={onCompleteCheckout}
                disabled={isCheckoutLoading || cart.length === 0}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <CheckCircle2 className="w-5 h-5" />
                {isCheckoutLoading ? 'Processing...' : 'Complete Payment & Print'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
