import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { printThermalReceipt, shareReceiptPdf } from '../../utils/mobilePrint';
import { Search, ShoppingCart, Plus, Minus, Trash2, CheckCircle2, X, DollarSign, Smartphone, AlertTriangle, Printer, Share2 } from 'lucide-react-native';

interface CartItem {
  id: string;
  name: string;
  price: number;
  type: 'PRODUCT' | 'SERVICE';
  quantity: number;
  productId?: string;
  serviceId?: string;
}

export const POSScreen: React.FC = () => {
  const { activeShopId, getSubscriptionInfo } = useAuthStore();
  const subInfo = getSubscriptionInfo();

  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'MPESA'>('CASH');
  const [customerName, setCustomerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedSale, setCompletedSale] = useState<any | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const shopQuery = activeShopId ? `?shopId=${activeShopId}` : '';
      const [prodRes, servRes] = await Promise.all([
        apiClient.get(`/products${shopQuery}`).catch(() => ({ data: { data: [] } })),
        apiClient.get(`/services${shopQuery}`).catch(() => ({ data: { data: [] } })),
      ]);

      const prodList = prodRes.data?.data || [];
      const servList = servRes.data?.data || [];
      setProducts(Array.isArray(prodList) ? prodList : []);
      setServices(Array.isArray(servList) ? servList : []);
    } catch (e) {
      console.error('Error fetching catalog:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeShopId]);

  const addToCart = (item: any, type: 'PRODUCT' | 'SERVICE') => {
    if (subInfo.isExpired) {
      Alert.alert(
        'Subscription Expired',
        'Your business subscription has expired. Please contact your account administrator or renew via the MFlow web portal.'
      );
      return;
    }

    const itemId = type === 'PRODUCT' ? item.id : item.id;
    const itemPrice = Number(type === 'PRODUCT' ? item.sellingPrice : item.price || 0);

    setCart((prev) => {
      const existing = prev.find((c) => c.id === itemId);
      if (existing) {
        return prev.map((c) => (c.id === itemId ? { ...c, quantity: c.quantity + 1 } : c));
      }
      return [
        ...prev,
        {
          id: itemId,
          name: item.name,
          price: itemPrice,
          type,
          quantity: 1,
          productId: type === 'PRODUCT' ? item.id : undefined,
          serviceId: type === 'SERVICE' ? item.id : undefined,
        },
      ];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const totalCartAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (subInfo.isExpired) {
      Alert.alert(
        'Subscription Expired',
        'Your business subscription has expired. Please contact your account administrator or renew via the MFlow web portal.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        shopId: activeShopId || undefined,
        paymentMethod: paymentMode,
        customerName: customerName.trim() || 'Walk-in Customer',
        items: cart.map((c) => ({
          productId: c.productId,
          serviceId: c.serviceId,
          quantity: c.quantity,
          unitPrice: c.price,
        })),
      };

      const res = await apiClient.post('/sales', payload);
      setCompletedSale(res.data.data);
      setCart([]);
      setIsCartModalOpen(false);
    } catch (e: any) {
      Alert.alert('Checkout Failed', e.response?.data?.message || 'Could not complete sale.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Combine products & services into display catalog
  const catalogList = [
    ...products.map((p) => ({ ...p, _type: 'PRODUCT' as const })),
    ...services.map((s) => ({ ...s, _type: 'SERVICE' as const })),
  ].filter((item) => item.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Header */}
      <View style={styles.searchHeader}>
        <View style={styles.searchBox}>
          <Search size={18} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products or services..."
            placeholderTextColor="#94A3B8"
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
          {searchTerm ? (
            <TouchableOpacity onPress={() => setSearchTerm('')}>
              <X size={16} color="#94A3B8" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Expired Subscription Informational Banner */}
      {subInfo.isExpired ? (
        <View style={styles.expiredBanner}>
          <AlertTriangle size={18} color="#B45309" style={{ marginRight: 8 }} />
          <Text style={styles.expiredBannerText}>
            Business subscription expired. Checkout is paused. Please renew via the web portal.
          </Text>
        </View>
      ) : null}

      {/* Catalog Items Grid */}
      {isLoading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator color="#4F46E5" size="large" />
        </View>
      ) : (
        <FlatList
          data={catalogList}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => {
            const isProduct = item._type === 'PRODUCT';
            const price = Number(isProduct ? item.sellingPrice : item.price || 0);

            return (
              <TouchableOpacity
                style={styles.itemCard}
                onPress={() => addToCart(item, item._type)}
                activeOpacity={0.7}
              >
                <View style={styles.badgeRow}>
                  <Text style={[styles.typeBadge, isProduct ? styles.badgeProd : styles.badgeServ]}>
                    {isProduct ? 'PRODUCT' : 'SERVICE'}
                  </Text>
                </View>
                <Text style={styles.itemName} numberOfLines={2}>
                  {item.name}
                </Text>
                <Text style={styles.itemPrice}>KES {price.toLocaleString()}</Text>
                <TouchableOpacity
                  style={styles.addBtn}
                  onPress={() => addToCart(item, item._type)}
                >
                  <Plus size={16} color="#FFFFFF" />
                  <Text style={styles.addBtnText}>Add</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Floating Bottom Cart Bar */}
      {cart.length > 0 ? (
        <View style={styles.floatingBar}>
          <View style={{ flex: 1 }}>
            <Text style={styles.barCartCount}>{totalCartCount} Items Selected</Text>
            <Text style={styles.barTotalText}>KES {totalCartAmount.toLocaleString()}</Text>
          </View>

          <TouchableOpacity
            style={styles.checkoutBtn}
            onPress={() => setIsCartModalOpen(true)}
          >
            <ShoppingCart size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.checkoutBtnText}>Checkout</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Checkout Modal */}
      <Modal visible={isCartModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Review Mobile Sale</Text>
              <TouchableOpacity onPress={() => setIsCartModalOpen(false)}>
                <X size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Cart Items List */}
            <FlatList
              data={cart}
              keyExtractor={(item) => item.id}
              style={{ maxHeight: 220 }}
              renderItem={({ item }) => (
                <View style={styles.cartRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cartRowName}>{item.name}</Text>
                    <Text style={styles.cartRowPrice}>
                      KES {item.price.toLocaleString()} x {item.quantity} = KES{' '}
                      {(item.price * item.quantity).toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.qtyControls}>
                    <TouchableOpacity
                      onPress={() => updateQuantity(item.id, -1)}
                      style={styles.qtyBtn}
                    >
                      <Minus size={14} color="#0F172A" />
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>{item.quantity}</Text>
                    <TouchableOpacity
                      onPress={() => updateQuantity(item.id, 1)}
                      style={styles.qtyBtn}
                    >
                      <Plus size={14} color="#0F172A" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />

            {/* Payment Method Toggle */}
            <Text style={styles.sectionLabel}>Select Payment Method</Text>
            <View style={styles.paymentRow}>
              <TouchableOpacity
                style={[styles.payOption, paymentMode === 'CASH' && styles.payOptionActive]}
                onPress={() => setPaymentMode('CASH')}
              >
                <DollarSign size={20} color={paymentMode === 'CASH' ? '#4F46E5' : '#64748B'} />
                <Text
                  style={[
                    styles.payOptionText,
                    paymentMode === 'CASH' && styles.payOptionTextActive,
                  ]}
                >
                  Cash
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.payOption, paymentMode === 'MPESA' && styles.payOptionActive]}
                onPress={() => setPaymentMode('MPESA')}
              >
                <Smartphone size={20} color={paymentMode === 'MPESA' ? '#10B981' : '#64748B'} />
                <Text
                  style={[
                    styles.payOptionText,
                    paymentMode === 'MPESA' && styles.payOptionTextActive,
                  ]}
                >
                  M-PESA
                </Text>
              </TouchableOpacity>
            </View>

            {/* Total Amount Summary */}
            <View style={styles.totalBox}>
              <Text style={styles.totalLabel}>Total Payable</Text>
              <Text style={styles.totalVal}>KES {totalCartAmount.toLocaleString()}</Text>
            </View>

            {/* Confirm Sale Button */}
            <TouchableOpacity
              style={[styles.confirmBtn, isSubmitting && { opacity: 0.6 }]}
              onPress={handleCheckout}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.confirmBtnText}>Complete & Record Sale</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Sale Receipt Confirmation Modal */}
      <Modal visible={!!completedSale} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={{ alignItems: 'center', marginVertical: 16 }}>
              <CheckCircle2 size={56} color="#10B981" />
              <Text style={styles.successTitle}>Transaction Complete!</Text>
              <Text style={styles.successReceipt}>Receipt #{completedSale?.receiptNumber}</Text>
              <Text style={styles.successAmount}>
                KES {Number(completedSale?.totalAmount || 0).toLocaleString()}
              </Text>
            </View>

            {/* Print & Share PDF Action Row */}
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: '#EEF2FF',
                  paddingVertical: 12,
                  borderRadius: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  gap: 6,
                  borderWidth: 1,
                  borderColor: '#C7D2FE',
                }}
                onPress={() => completedSale && printThermalReceipt(completedSale)}
              >
                <Printer size={18} color="#4F46E5" />
                <Text style={{ color: '#4F46E5', fontSize: 13, fontWeight: '800' }}>Print Receipt</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: '#ECFDF5',
                  paddingVertical: 12,
                  borderRadius: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  gap: 6,
                  borderWidth: 1,
                  borderColor: '#A7F3D0',
                }}
                onPress={() => completedSale && shareReceiptPdf(completedSale)}
              >
                <Share2 size={18} color="#059669" />
                <Text style={{ color: '#059669', fontSize: 13, fontWeight: '800' }}>Share PDF</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.doneBtn}
              onPress={() => setCompletedSale(null)}
            >
              <Text style={styles.doneBtnText}>Close & Return to Register</Text>
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
  expiredBanner: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  expiredBannerText: {
    color: '#92400E',
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
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
    padding: 12,
    paddingBottom: 90,
  },
  itemCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    margin: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'space-between',
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  typeBadge: {
    fontSize: 9,
    fontWeight: '900',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
  badgeProd: {
    backgroundColor: '#EEF2FF',
    color: '#4F46E5',
  },
  badgeServ: {
    backgroundColor: '#F5F3FF',
    color: '#7C3AED',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '900',
    color: '#059669',
    marginBottom: 12,
  },
  addBtn: {
    backgroundColor: '#4F46E5',
    borderRadius: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  floatingBar: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  barCartCount: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  barTotalText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },
  checkoutBtn: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkoutBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
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
  cartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  cartRowName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  cartRowPrice: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 4,
  },
  qtyBtn: {
    padding: 6,
  },
  qtyText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    paddingHorizontal: 8,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    marginTop: 16,
    marginBottom: 8,
  },
  paymentRow: {
    flexDirection: 'row',
    gap: 12,
  },
  payOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  payOptionActive: {
    borderColor: '#4F46E5',
    backgroundColor: '#EEF2FF',
  },
  payOptionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  payOptionTextActive: {
    color: '#4F46E5',
    fontWeight: '900',
  },
  totalBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 18,
    paddingTop: 14,
    borderTopWidth: 2,
    borderTopColor: '#F1F5F9',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  totalVal: {
    fontSize: 24,
    fontWeight: '900',
    color: '#059669',
  },
  confirmBtn: {
    backgroundColor: '#4F46E5',
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 12,
  },
  successReceipt: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4F46E5',
    marginTop: 4,
  },
  successAmount: {
    fontSize: 28,
    fontWeight: '900',
    color: '#059669',
    marginTop: 8,
  },
  doneBtn: {
    backgroundColor: '#0F172A',
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
