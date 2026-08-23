import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Platform,
} from 'react-native';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { Search, Receipt, Printer, X, CheckCircle2 } from 'lucide-react-native';

export const SalesHistoryScreen: React.FC = () => {
  const { activeShopId } = useAuthStore();

  const [sales, setSales] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSale, setSelectedSale] = useState<any | null>(null);

  const fetchSales = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get(`/sales${activeShopId ? `?shopId=${activeShopId}` : ''}`);
      const salesArr = res.data?.data?.sales || res.data?.data || [];
      setSales(Array.isArray(salesArr) ? salesArr : []);
    } catch (e) {
      console.error('Failed to fetch mobile sales log:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [activeShopId]);

  const filteredSales = sales.filter(
    (s) =>
      s.receiptNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Header */}
      <View style={styles.searchHeader}>
        <View style={styles.searchBox}>
          <Search size={18} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by receipt # or customer..."
            placeholderTextColor="#94A3B8"
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>
      </View>

      {/* Sales List */}
      {isLoading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator color="#4F46E5" size="large" />
        </View>
      ) : (
        <FlatList
          data={filteredSales}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => {
            const isCancelled = item.status === 'CANCELLED' || item.status === 'VOIDED';
            const paymentMethods = item.payments
              ? item.payments.map((p: any) => p.paymentMethod?.name || p.paymentMethod).join(', ')
              : item.paymentMethod || 'CASH';

            return (
              <TouchableOpacity
                style={styles.saleCard}
                onPress={() => setSelectedSale(item)}
                activeOpacity={0.7}
              >
                <View style={styles.saleHeaderRow}>
                  <Text style={styles.receiptNum}>{item.receiptNumber}</Text>
                  <View style={[styles.statusBadge, isCancelled ? styles.badgeRose : styles.badgeEmerald]}>
                    <Text style={[styles.statusText, isCancelled ? styles.textRose : styles.textEmerald]}>
                      {item.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.saleDetailRow}>
                  <Text style={styles.customerText}>{item.customer?.name || 'Walk-in Customer'}</Text>
                  <Text style={styles.amountText}>KES {Number(item.totalAmount).toLocaleString()}</Text>
                </View>

                <View style={styles.saleFooterRow}>
                  <Text style={styles.payMethodText}>{paymentMethods}</Text>
                  <Text style={styles.dateText}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Receipt Detail Modal */}
      <Modal visible={!!selectedSale} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Thermal Receipt Preview</Text>
              <TouchableOpacity onPress={() => setSelectedSale(null)}>
                <X size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            {selectedSale ? (
              <ScrollView style={styles.receiptPaper}>
                <Text style={styles.receiptMono}>================================</Text>
                <Text style={styles.receiptCenter}>          RECEIPT               </Text>
                <Text style={styles.receiptMono}>================================</Text>
                <Text style={styles.receiptMono}>Receipt #: {selectedSale.receiptNumber}</Text>
                <Text style={styles.receiptMono}>Date     : {new Date(selectedSale.createdAt).toLocaleString()}</Text>
                <Text style={styles.receiptMono}>Customer : {selectedSale.customer?.name || 'Walk-in Customer'}</Text>
                <Text style={styles.receiptMono}>--------------------------------</Text>
                <Text style={styles.receiptMono}>Item              Qty     Total </Text>
                <Text style={styles.receiptMono}>--------------------------------</Text>

                {(selectedSale.items || []).map((i: any, idx: number) => {
                  const name = (i.product?.name || i.service?.name || i.name || 'Item').padEnd(16, ' ').slice(0, 16);
                  const qty = (i.quantity || 1).toString().padStart(3, ' ');
                  const total = `KES ${Number(i.totalPrice ?? i.price ?? 0).toLocaleString()}`.padStart(11, ' ');
                  return (
                    <Text key={idx} style={styles.receiptMono}>
                      {name} {qty} {total}
                    </Text>
                  );
                })}

                <Text style={styles.receiptMono}>--------------------------------</Text>
                <Text style={styles.receiptMonoBold}>
                  TOTAL AMOUNT  : KES {Number(selectedSale.totalAmount || 0).toLocaleString()}
                </Text>
                <Text style={styles.receiptMono}>--------------------------------</Text>
                <Text style={styles.receiptCenter}>Thank you for your business!</Text>
                <Text style={styles.receiptMono}>================================</Text>
              </ScrollView>
            ) : null}

            <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedSale(null)}>
              <Text style={styles.closeBtnText}>Close Preview</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  searchHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContainer: {
    padding: 16,
  },
  saleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  saleHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  receiptNum: {
    fontSize: 15,
    fontWeight: '900',
    color: '#4F46E5',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeEmerald: {
    backgroundColor: '#D1FAE5',
  },
  badgeRose: {
    backgroundColor: '#FFE4E6',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  textEmerald: {
    color: '#047857',
  },
  textRose: {
    color: '#BE123C',
  },
  saleDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  customerText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  amountText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  saleFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  payMethodText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  dateText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  receiptPaper: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    maxHeight: 320,
  },
  receiptMono: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 12,
    color: '#334155',
    lineHeight: 18,
  },
  receiptMonoBold: {
    fontFamily: Platform.OS === 'ios' ? 'Courier-Bold' : 'monospace',
    fontSize: 12,
    fontWeight: '900',
    color: '#0F172A',
    lineHeight: 20,
  },
  receiptCenter: {
    fontFamily: Platform.OS === 'ios' ? 'Courier-Bold' : 'monospace',
    fontSize: 12,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
  },
  closeBtn: {
    backgroundColor: '#0F172A',
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  closeBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
