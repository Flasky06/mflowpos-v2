import React, { useState, useEffect, useRef } from 'react';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { ThermalReceiptModal } from '../sales/ThermalReceiptModal';
import { CartModal, CartItem } from '../sales/CartModal';
import {
  ShoppingCart,
  Search,
  Barcode,
  List,
  LayoutGrid,
} from 'lucide-react';

export const POSWorkspace: React.FC = () => {
  const { activeShopId } = useAuthStore();
  const addToast = useToastStore((state) => state.addToast);

  // POS State
  const [products, setProducts] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'PRODUCTS' | 'SERVICES'>('PRODUCTS');
  const [viewStyle, setViewStyle] = useState<'TABLE' | 'GRID'>('TABLE');

  // Multi-Step Modal State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [globalDiscount, setGlobalDiscount] = useState<number>(0);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash Account');

  const [isCartModalOpen, setIsCartModalOpen] = useState<boolean>(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState<boolean>(false);

  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [thermalPayload, setThermalPayload] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const fetchSalesData = async () => {
    try {
      const [prodRes, srvRes, custRes] = await Promise.all([
        apiClient.get('/products'),
        apiClient.get('/services'),
        apiClient.get('/customers'),
      ]);
      setProducts(prodRes.data.data || []);
      setServices(srvRes.data.data || []);
      setCustomers(custRes.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSalesData();
  }, [activeShopId]);

  // Hardware Barcode Scanner Handler
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      e.preventDefault();
      const foundProduct = products.find(
        (p) =>
          p.barcode === searchTerm.trim() ||
          p.sku?.toLowerCase() === searchTerm.trim().toLowerCase()
      );

      if (foundProduct) {
        addToCart(foundProduct, 'PRODUCT');
        setSearchTerm('');
        addToast({ type: 'info', title: 'Barcode Scanned', message: `Added '${foundProduct.name}'` });
      }
    }
  };

  const addToCart = (item: any, type: 'PRODUCT' | 'SERVICE' = 'PRODUCT') => {
    const isProd = type === 'PRODUCT';
    const idField = isProd ? 'productId' : 'serviceId';
    const itemId = item.id;

    const existingIndex = cart.findIndex((i) => i[idField] === itemId);

    if (existingIndex > -1) {
      const newCart = [...cart];
      newCart[existingIndex].quantity += 1;
      setCart(newCart);
    } else {
      const price = isProd ? Number(item.sellingPrice) : Number(item.price);
      setCart([
        ...cart,
        {
          [idField]: itemId,
          name: item.name,
          type,
          quantity: 1,
          unitPrice: price,
          discount: 0,
          itemRef: item,
        },
      ]);
    }
  };

  const updateQuantity = (index: number, delta: number) => {
    const newCart = [...cart];
    const newQty = newCart[index].quantity + delta;

    if (newQty <= 0) {
      newCart.splice(index, 1);
    } else {
      newCart[index].quantity = newQty;
    }
    setCart(newCart);
  };

  const updateItemDiscount = (index: number, discountAmount: number) => {
    const newCart = [...cart];
    newCart[index].discount = Math.max(0, discountAmount || 0);
    setCart(newCart);
  };

  const removeFromCart = (index: number) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  // Financial Calculations
  const cartSubtotal = cart.reduce((sum, i) => {
    const effectiveUnitPrice = Math.max(0, i.unitPrice - (i.discount || 0));
    return sum + i.quantity * effectiveUnitPrice;
  }, 0);

  const totalPayableAmount = Math.max(0, cartSubtotal - (globalDiscount || 0));
  const totalItemCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) {
      addToast({ type: 'warning', title: 'Cart Empty', message: 'Add items to the cart before checkout' });
      return;
    }

    if (!activeShopId) {
      addToast({ type: 'error', title: 'No Branch Selected', message: 'Please select an active shop branch' });
      return;
    }

    const isCreditSale = paymentMethod === 'CREDIT' || paymentMethod.toLowerCase().includes('credit');
    if (isCreditSale && !selectedCustomer) {
      addToast({ type: 'warning', title: 'Customer Required', message: 'Please select a customer for Credit sales' });
      return;
    }

    setIsCheckoutLoading(true);
    try {
      const payload = {
        shopId: activeShopId,
        items: cart.map((i) => {
          const effectiveUnitPrice = Math.max(0, i.unitPrice - (i.discount || 0));
          return {
            productId: i.productId,
            serviceId: i.serviceId,
            quantity: i.quantity,
            unitPrice: effectiveUnitPrice,
          };
        }),
        payments: [
          {
            paymentMethod,
            amount: totalPayableAmount,
          },
        ],
        customerId: selectedCustomer || undefined,
      };

      const res = await apiClient.post('/sales', payload);
      const { sale, thermalReceiptPayload } = res.data.data;

      addToast({
        type: 'success',
        title: 'Sale Processed Successfully',
        message: `Receipt ${sale.receiptNumber} created!`,
      });

      setThermalPayload(thermalReceiptPayload);
      setCart([]);
      setGlobalDiscount(0);
      setIsCartModalOpen(false);
      setIsCheckoutModalOpen(false);
      fetchSalesData();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Checkout failed.';
      addToast({ type: 'error', title: 'Transaction Error', message: msg });
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  // Filter Catalog Items
  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.barcode?.includes(searchTerm)
  );

  const filteredServices = services.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {ThermalReceiptModal && (
        <ThermalReceiptModal
          isOpen={!!thermalPayload}
          onClose={() => setThermalPayload(null)}
          receiptPayload={thermalPayload || ''}
        />
      )}

      {/* Top Control Bar: Search & Category Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        {/* Search Bar Input */}
        <div className="relative flex-1 min-w-0">
          <input
            ref={searchInputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search products or services by name..."
            className="w-full bg-white border border-slate-300 rounded-xl py-3 px-4 pl-11 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 text-sm font-semibold shadow-xs"
          />
          <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
        </div>

        {/* Products / Services Category Toggle & Cart Button */}
        <div className="flex items-center gap-3 shrink-0 flex-wrap sm:flex-nowrap">
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-xs">
            <button
              onClick={() => setActiveTab('PRODUCTS')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
                activeTab === 'PRODUCTS' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Products ({filteredProducts.length})
            </button>
            <button
              onClick={() => setActiveTab('SERVICES')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
                activeTab === 'SERVICES' ? 'bg-white text-violet-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Services ({filteredServices.length})
            </button>
          </div>

          <button
            onClick={() => setIsCartModalOpen(true)}
            className="relative py-2.5 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center gap-2"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Cart ({totalItemCount} items)</span>
            {totalItemCount > 0 && (
              <span className="ml-1 bg-rose-500 text-white text-[11px] font-extrabold px-2 py-0.5 rounded-full border border-white shadow-xs">
                {totalItemCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Catalog Workspace Container */}
      <div className="w-full bg-white p-4 md:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col min-h-[calc(100vh-12rem)]">
        {/* Table / Grid Layout View Toggle */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {activeTab === 'PRODUCTS' ? `Products Catalog (${filteredProducts.length})` : `Services Catalog (${filteredServices.length})`}
          </div>

          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewStyle('TABLE')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 ${
                viewStyle === 'TABLE' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Table View (v1 Style)"
            >
              <List className="w-4 h-4" />
              Table
            </button>
            <button
              onClick={() => setViewStyle('GRID')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 ${
                viewStyle === 'GRID' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Grid Cards View"
            >
              <LayoutGrid className="w-4 h-4" />
              Grid
            </button>
          </div>
        </div>

        {/* Full-Width Table View */}
        {viewStyle === 'TABLE' ? (
          <div className="flex-1 overflow-y-auto border border-slate-200 rounded-xl overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="text-xs uppercase bg-slate-100 text-slate-600 border-b border-slate-200 sticky top-0">
                {activeTab === 'PRODUCTS' ? (
                  <tr>
                    <th className="py-3.5 px-4">Product Name</th>
                    <th className="py-3.5 px-4">Buying Price</th>
                    <th className="py-3.5 px-4 text-right">Selling Price</th>
                    <th className="py-3.5 px-4 text-center">Available Stock</th>
                    <th className="py-3.5 px-4 text-center">Action</th>
                  </tr>
                ) : (
                  <tr>
                    <th className="py-3.5 px-4">Service Title</th>
                    <th className="py-3.5 px-4 text-right">Selling Price</th>
                    <th className="py-3.5 px-4 text-center">Inventory Type</th>
                    <th className="py-3.5 px-4 text-center">Action</th>
                  </tr>
                )}
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {activeTab === 'PRODUCTS' &&
                  filteredProducts.map((p) => {
                    const stock = p.stocks?.find((s: any) => s.shopId === activeShopId);
                    const qty = stock ? stock.quantity : 0;
                    const isOut = qty <= 0;

                    return (
                      <tr key={p.id} className="hover:bg-indigo-50/50 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-slate-900">{p.name}</td>
                        <td className="py-3.5 px-4 text-xs text-slate-500">
                          {p.costPrice ? `KSh ${Number(p.costPrice).toLocaleString()}` : '-'}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                          KSh {Number(p.sellingPrice).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                          {isOut ? (
                            <span className="text-rose-600 font-black">Out of Stock</span>
                          ) : (
                            `${qty} units`
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            disabled={isOut}
                            onClick={() => addToCart(p, 'PRODUCT')}
                            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
                          >
                            + Add
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                {activeTab === 'SERVICES' &&
                  filteredServices.map((s) => (
                    <tr key={s.id} className="hover:bg-violet-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">{s.name}</td>
                      <td className="py-3.5 px-4 text-right font-bold text-emerald-700">
                        KSh {Number(s.price).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-center text-xs text-slate-400 font-semibold">Non-Inventory Service</td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => addToCart(s, 'SERVICE')}
                          className="px-3.5 py-1.5 bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 rounded-lg text-xs font-bold shadow-xs transition-colors"
                        >
                          + Add
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Grid View - Multi-breakpoint responsive grid (Mobile: 1-2, Tablet: 2-3, Laptop: 4-5, Large Screen: 6) */
          <div className="flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4 pr-1">
            {activeTab === 'PRODUCTS' &&
              filteredProducts.map((p) => {
                const stock = p.stocks?.find((s: any) => s.shopId === activeShopId);
                const qty = stock ? stock.quantity : 0;
                const isOut = qty <= 0;

                return (
                  <div
                    key={p.id}
                    className={`bg-white p-3 rounded-xl border flex flex-col justify-between transition-all ${
                      isOut ? 'opacity-50 border-rose-200 bg-rose-50/20' : 'border-slate-200 shadow-xs'
                    }`}
                  >
                    <div>
                      <span className="text-[10px] uppercase font-bold text-indigo-600 tracking-wider">Product</span>
                      <h4 className="font-semibold text-sm text-slate-900 line-clamp-2 mt-0.5">{p.name}</h4>
                    </div>

                    <div className="mt-3 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-emerald-700">KSh {Number(p.sellingPrice).toLocaleString()}</span>
                        <span className={`font-semibold ${isOut ? 'text-rose-600' : 'text-slate-500'}`}>
                          Qty: {qty}
                        </span>
                      </div>

                      <button
                        onClick={() => addToCart(p, 'PRODUCT')}
                        disabled={isOut}
                        className="w-full py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold rounded-lg text-xs transition-colors disabled:opacity-40"
                      >
                        + Add to Cart
                      </button>
                    </div>
                  </div>
                );
              })}

            {activeTab === 'SERVICES' &&
              filteredServices.map((s) => (
                <div
                  key={s.id}
                  className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col justify-between shadow-xs"
                >
                  <div>
                    <span className="text-[10px] uppercase font-bold text-violet-600 tracking-wider">Service</span>
                    <h4 className="font-semibold text-sm text-slate-900 line-clamp-2 mt-0.5">{s.name}</h4>
                  </div>

                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-emerald-700">KSh {Number(s.price).toLocaleString()}</span>
                      <span className="font-medium text-violet-600">Service</span>
                    </div>

                    <button
                      onClick={() => addToCart(s, 'SERVICE')}
                      className="w-full py-1.5 bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 font-bold rounded-lg text-xs transition-colors"
                    >
                      + Add to Cart
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Reusable Cart Modal */}
      <CartModal
        isCartModalOpen={isCartModalOpen}
        isCheckoutModalOpen={isCheckoutModalOpen}
        cart={cart}
        customers={customers}
        selectedCustomer={selectedCustomer}
        paymentMethod={paymentMethod}
        globalDiscount={globalDiscount}
        isCheckoutLoading={isCheckoutLoading}
        onCloseCartModal={() => setIsCartModalOpen(false)}
        onCloseCheckoutModal={() => setIsCheckoutModalOpen(false)}
        onOpenCheckoutModal={() => {
          setIsCartModalOpen(false);
          setIsCheckoutModalOpen(true);
        }}
        onOpenCartModal={() => {
          setIsCheckoutModalOpen(false);
          setIsCartModalOpen(true);
        }}
        onUpdateQuantity={updateQuantity}
        onUpdateItemDiscount={updateItemDiscount}
        onRemoveFromCart={removeFromCart}
        onSetSelectedCustomer={setSelectedCustomer}
        onSetPaymentMethod={setPaymentMethod}
        onSetGlobalDiscount={setGlobalDiscount}
        onCompleteCheckout={handleCheckout}
      />
    </div>
  );
};
