import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { Pagination } from '../../components/common/Pagination';
import { Wrench, DollarSign, Calendar, Search, Printer } from 'lucide-react';

export const ServicesSalesHistoryPage: React.FC = () => {
  const { activeShopId } = useAuthStore();
  const addToast = useToastStore((state) => state.addToast);

  const [startDate, setStartDate] = useState<string>(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const [salesList, setSalesList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchServicesHistory = async () => {
    setIsLoading(true);
    try {
      const salesRes = await apiClient.get(`/sales?startDate=${startDate}&endDate=${endDate}${activeShopId ? `&shopId=${activeShopId}` : ''}`);
      const salesArr = salesRes.data.data?.sales || salesRes.data.data || [];
      setSalesList(Array.isArray(salesArr) ? salesArr : []);
    } catch (err: any) {
      console.error(err);
      addToast({ type: 'error', title: 'Error', message: 'Failed to load services sales history' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchServicesHistory();
  }, [activeShopId, startDate, endDate]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, startDate, endDate]);

  // Extract all non-inventory service line items from sales
  const serviceLineItems: any[] = [];
  salesList.forEach((sale) => {
    (sale.items || []).forEach((item: any) => {
      if (item.serviceId || item.service) {
        const unitPrice = Number(item.unitPrice || item.price || 0);
        const qty = Number(item.quantity || 1);
        const lineRevenue = qty * unitPrice;

        serviceLineItems.push({
          id: `${sale.id}-${item.id}`,
          receiptNumber: sale.receiptNumber || sale.id.substring(0, 8),
          serviceName: item.service?.name || item.name || 'Service Job',
          serviceCode: item.service?.code || '-',
          customerName: sale.customer?.name || 'Walk-in Customer',
          quantity: qty,
          unitPrice,
          lineRevenue,
          date: sale.createdAt,
        });
      }
    });
  });

  const totalServicesSales = serviceLineItems.reduce((sum, i) => sum + i.lineRevenue, 0);

  const filteredItems = serviceLineItems.filter(
    (i) =>
      i.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1800px] w-full mx-auto space-y-6">
      {/* Basic Total Sales KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Basic Total Services Sales */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center font-bold">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Basic Total Services Sales</p>
            <h3 className="text-2xl font-extrabold text-violet-600 mt-0.5">
              KES {totalServicesSales.toLocaleString()}
            </h3>
          </div>
        </div>

        {/* Total Service Jobs Rendered */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Total Services Rendered</p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-0.5">
              {serviceLineItems.length} Service Jobs
            </h3>
          </div>
        </div>
      </div>

      {/* Main Services Sales Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        {/* Unified Search & Date Filter Toolbar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by receipt #, service title, or customer..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 pl-9 text-xs font-semibold focus:outline-none focus:border-indigo-600"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>

            {/* Date Range Picker */}
            <div className="flex items-center bg-slate-50 border border-slate-300 p-1 rounded-xl shrink-0">
              <span className="text-xs font-semibold text-slate-500 px-2 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              </span>
              <input
                type="date"
                value={startDate}
                max={endDate}
                onChange={(e) => {
                  const val = e.target.value;
                  setStartDate(val);
                  if (val && endDate && val > endDate) setEndDate(val);
                }}
                className="text-xs font-bold text-slate-800 bg-transparent py-1 px-1 focus:outline-none"
              />
              <span className="text-slate-300">-</span>
              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => {
                  const val = e.target.value;
                  setEndDate(val);
                  if (val && startDate && val < startDate) setStartDate(val);
                }}
                className="text-xs font-bold text-slate-800 bg-transparent py-1 px-1 focus:outline-none"
              />
              <button
                onClick={fetchServicesHistory}
                className="ml-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
                Filter
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3">
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 border border-slate-200 cursor-pointer print:hidden"
              title="Print Full Page Log (Standard Printer)"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              Print Log
            </button>
            <span className="text-xs font-bold text-slate-500 shrink-0">
              {filteredItems.length} Service Transactions
            </span>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="text-xs uppercase bg-slate-100 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Receipt #</th>
                <th className="py-3.5 px-4">Service Title</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4 text-center">Times Rendered</th>
                <th className="py-3.5 px-4 text-right">Unit Price</th>
                <th className="py-3.5 px-4 text-right">Total Revenue</th>
                <th className="py-3.5 px-4 text-center">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No service sales recorded for this period.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 text-xs">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-700">{item.receiptNumber}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{item.serviceName}</td>
                    <td className="py-3 px-4 text-slate-600">{item.customerName}</td>
                    <td className="py-3 px-4 text-center font-bold text-slate-800">{item.quantity}</td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-800">
                      KES {item.unitPrice.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-extrabold text-violet-600">
                      KES {item.lineRevenue.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-slate-500">
                      {new Date(item.date).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredItems.length}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
};
