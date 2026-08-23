import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { DollarSign, TrendingUp, TrendingDown, AlertCircle, ShoppingBag, ArrowRight } from 'lucide-react-native';

export const DashboardScreen: React.FC<any> = ({ navigation }) => {
  const { activeShopId, getSubscriptionInfo } = useAuthStore();
  const subInfo = getSubscriptionInfo();

  const [isLoading, setIsLoading] = useState(false);
  const [metrics, setMetrics] = useState({
    todaySales: 0,
    salesCount: 0,
    todayExpenses: 0,
    lowStockCount: 0,
  });
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const shopQuery = activeShopId ? `&shopId=${activeShopId}` : '';

      const [salesRes, expRes, prodRes] = await Promise.all([
        apiClient.get(`/sales?startDate=${todayStr}&endDate=${todayStr}${shopQuery}`).catch(() => ({ data: { data: [] } })),
        apiClient.get(`/expenses?startDate=${todayStr}&endDate=${todayStr}${shopQuery}`).catch(() => ({ data: { data: [] } })),
        apiClient.get(`/products${activeShopId ? `?shopId=${activeShopId}` : ''}`).catch(() => ({ data: { data: [] } })),
      ]);

      const salesList = salesRes.data?.data?.sales || salesRes.data?.data || [];
      const expList = expRes.data?.data?.expenses || expRes.data?.data || [];
      const prodList = prodRes.data?.data || [];

      const totalSales = salesList.reduce((sum: number, s: any) => sum + Number(s.totalAmount || 0), 0);
      const totalExp = expList.reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0);

      const lowStock = prodList.filter(
        (p: any) => p.trackInventory && Number(p.stockQuantity || 0) <= Number(p.reorderLevel || 5)
      );

      setMetrics({
        todaySales: totalSales,
        salesCount: salesList.length,
        todayExpenses: totalExp,
        lowStockCount: lowStock.length,
      });

      setLowStockProducts(lowStock);
    } catch (e) {
      console.error('Failed to fetch mobile dashboard data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [activeShopId]);

  const netProfit = metrics.todaySales - metrics.todayExpenses;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Expired Subscription Notice */}
        {subInfo.isExpired ? (
          <View style={styles.expiredBanner}>
            <Text style={styles.expiredTitle}>⚠️ Business Subscription Expired</Text>
            <Text style={styles.expiredDesc}>
              POS register transactions are paused. Please contact your account administrator or renew via the web portal.
            </Text>
          </View>
        ) : null}

        {/* Dashboard Title Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Daily Performance</Text>
            <Text style={styles.headerSubtitle}>Real-time shop metrics for today</Text>
          </View>
          <TouchableOpacity style={styles.refreshBtn} onPress={fetchDashboardData}>
            <Text style={styles.refreshBtnText}>Refresh</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator color="#4F46E5" size="large" />
          </View>
        ) : (
          <>
            {/* KPI Cards Grid */}
            <View style={styles.kpiGrid}>
              {/* Sales KPI */}
              <View style={styles.kpiCard}>
                <View style={[styles.kpiIconBox, { backgroundColor: '#EEF2FF' }]}>
                  <DollarSign size={20} color="#4F46E5" />
                </View>
                <Text style={styles.kpiLabel}>Today's Sales</Text>
                <Text style={styles.kpiValue}>KES {metrics.todaySales.toLocaleString()}</Text>
                <Text style={styles.kpiSub}>{metrics.salesCount} Completed Transactions</Text>
              </View>

              {/* Net Profit KPI */}
              <View style={styles.kpiCard}>
                <View style={[styles.kpiIconBox, { backgroundColor: '#D1FAE5' }]}>
                  <TrendingUp size={20} color="#059669" />
                </View>
                <Text style={styles.kpiLabel}>Today's Net Profit</Text>
                <Text style={[styles.kpiValue, { color: netProfit >= 0 ? '#059669' : '#DC2626' }]}>
                  KES {netProfit.toLocaleString()}
                </Text>
                <Text style={styles.kpiSub}>Sales minus Expenses</Text>
              </View>

              {/* Expenses Outflow KPI */}
              <View style={styles.kpiCard}>
                <View style={[styles.kpiIconBox, { backgroundColor: '#FFE4E6' }]}>
                  <TrendingDown size={20} color="#E11D48" />
                </View>
                <Text style={styles.kpiLabel}>Today's Outflows</Text>
                <Text style={[styles.kpiValue, { color: '#E11D48' }]}>
                  KES {metrics.todayExpenses.toLocaleString()}
                </Text>
                <Text style={styles.kpiSub}>Recorded Business Expenses</Text>
              </View>

              {/* Low Stock Warning KPI */}
              <View style={styles.kpiCard}>
                <View style={[styles.kpiIconBox, { backgroundColor: '#FEF3C7' }]}>
                  <AlertCircle size={20} color="#D97706" />
                </View>
                <Text style={styles.kpiLabel}>Low Stock Alerts</Text>
                <Text style={[styles.kpiValue, { color: '#D97706' }]}>
                  {metrics.lowStockCount} Items Low
                </Text>
                <Text style={styles.kpiSub}>Below reorder threshold</Text>
              </View>
            </View>

            {/* POS Register Quick Launch Banner */}
            <TouchableOpacity
              style={styles.posBanner}
              onPress={() => navigation.navigate('POSRegister')}
              activeOpacity={0.8}
            >
              <View style={styles.posBannerLeft}>
                <View style={styles.posIconCircle}>
                  <ShoppingBag size={24} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={styles.posBannerTitle}>Open POS Register</Text>
                  <Text style={styles.posBannerDesc}>Instant checkout for walk-in retail sales</Text>
                </View>
              </View>
              <ArrowRight size={20} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Low Stock Items List */}
            {lowStockProducts.length > 0 ? (
              <View style={styles.lowStockSection}>
                <Text style={styles.sectionTitle}>Low Stock Items Requiring Restock</Text>
                {lowStockProducts.slice(0, 5).map((prod) => (
                  <View key={prod.id} style={styles.lowStockRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.lowStockName}>{prod.name}</Text>
                      <Text style={styles.lowStockCat}>{prod.category?.name || 'General Product'}</Text>
                    </View>
                    <View style={styles.stockBadgeAlert}>
                      <Text style={styles.stockBadgeText}>{prod.stockQuantity || 0} in Stock</Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 18,
  },
  expiredBanner: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  expiredTitle: {
    color: '#92400E',
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 4,
  },
  expiredDesc: {
    color: '#78350F',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  refreshBtn: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  refreshBtnText: {
    color: '#4F46E5',
    fontSize: 12,
    fontWeight: '800',
  },
  centerBox: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  kpiCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  kpiIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 4,
  },
  kpiSub: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 4,
  },
  posBanner: {
    backgroundColor: '#4F46E5',
    borderRadius: 22,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  posBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  posIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  posBannerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  posBannerDesc: {
    color: '#EEF2FF',
    fontSize: 12,
    marginTop: 2,
  },
  lowStockSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  lowStockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  lowStockName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  lowStockCat: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  stockBadgeAlert: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  stockBadgeText: {
    color: '#DC2626',
    fontSize: 11,
    fontWeight: '800',
  },
});
