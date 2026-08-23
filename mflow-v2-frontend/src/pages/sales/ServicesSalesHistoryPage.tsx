import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { Wrench, DollarSign, Calendar, Search } from 'lucide-react';

export const ServicesSalesHistoryPage: React.FC = () => {
  const { activeShopId } = useAuthStore();
  const addToast = useToastStore((state) => state.addToast);

  const [startDate, setStartDate] = useState<string>(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');

  const [salesList, setSalesList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchServicesHistory = async () => {
    setIsLoading(true);
    try {
      const salesRes = await apiClient.get(`/sales${activeShopId ? `?shopId=${activeShopId}` : ''}`);
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

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1800px] w-full mx-auto space-y-6">
      {/* Date Filter Bar */}
      <div className="flex justify-end pb-4 border-b border-slate-200">
        {/* Date Filter */}
        <div className="flex items-center bg-white border border-slate-200 p-1.5 rounded-xl shadow-xs">
          <span className="text-xs font-semibold text-slate-500 px-2 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-indigo-600" /> Date Period:
          </span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="text-xs font-bold text-slate-800 bg-transparent py-1 px-1 focus:outline-none"
          />
          <span className="text-slate-300">-</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="text-xs font-bold text-slate-800 bg-transparent py-1 px-1 focus:outline-none"
          />
          <button
            onClick={fetchServicesHistory}
            className="ml-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Search className="w-3.5 h-3.5" />
            Filter
          </button>
        </div>
      </div>

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
              KSh {totalServicesSales.toLocaleString()}
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
        <div className="flex items-center justify-between gap-4 flex-wrap pb-3 border-b border-slate-200">
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

          <span className="text-xs font-bold text-slate-500">
            {filteredItems.length} Service Transactions
          </span>
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
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 text-xs">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-700">{item.receiptNumber}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{item.serviceName}</td>
                    <td className="py-3 px-4 text-slate-600">{item.customerName}</td>
                    <td className="py-3 px-4 text-center font-bold text-slate-800">{item.quantity}</td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-800">
                      KSh {item.unitPrice.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-extrabold text-violet-600">
                      KSh {item.lineRevenue.toLocaleString()}
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
      </div>
    </div>
  );
};
