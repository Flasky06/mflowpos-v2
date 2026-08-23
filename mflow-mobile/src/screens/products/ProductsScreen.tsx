import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { Search, Package, AlertCircle, X } from 'lucide-react-native';

export const ProductsScreen: React.FC = () => {
  const { activeShopId } = useAuthStore();

  const [products, setProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const shopQuery = activeShopId ? `?shopId=${activeShopId}` : '';
      const res = await apiClient.get(`/products${shopQuery}`);
      const list = res.data?.data || [];
      setProducts(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error('Failed to fetch mobile products catalog:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [activeShopId]);

  const filteredProducts = products.filter(
    (p) =>
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.barcode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Header */}
      <View style={styles.searchHeader}>
        <View style={styles.searchBox}>
          <Search size={18} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by product name, SKU, or barcode..."
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

      {/* Product List */}
      {isLoading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator color="#4F46E5" size="large" />
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => {
            const stock = Number(item.stockQuantity || 0);
            const reorder = Number(item.reorderLevel || 5);
            const isLowStock = item.trackInventory && stock <= reorder;
            const costPrice = Number(item.costPrice || 0);
            const sellingPrice = Number(item.sellingPrice || 0);
            const margin = sellingPrice - costPrice;

            return (
              <View style={styles.productCard}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.productName}>{item.name}</Text>
                    {item.sku ? <Text style={styles.skuText}>SKU: {item.sku}</Text> : null}
                  </View>

                  <View style={[styles.stockBadge, isLowStock ? styles.badgeLow : styles.badgeOk]}>
                    {isLowStock ? (
                      <AlertCircle size={12} color="#DC2626" style={{ marginRight: 4 }} />
                    ) : null}
                    <Text style={[styles.stockText, isLowStock ? styles.textLow : styles.textOk]}>
                      {item.trackInventory ? `${stock} in stock` : 'Unlimited'}
                    </Text>
                  </View>
                </View>

                <View style={styles.priceRow}>
                  <View>
                    <Text style={styles.priceLabel}>Selling Price</Text>
                    <Text style={styles.sellingVal}>KES {sellingPrice.toLocaleString()}</Text>
                  </View>

                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.priceLabel}>Est. Profit Margin</Text>
                    <Text style={styles.marginVal}>+KES {margin.toLocaleString()}</Text>
                  </View>
                </View>
              </View>
            );
          }}
        />
      )}
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
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  productName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  skuText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontFamily: 'monospace',
  },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeOk: {
    backgroundColor: '#F1F5F9',
  },
  badgeLow: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
  },
  stockText: {
    fontSize: 11,
    fontWeight: '800',
  },
  textOk: {
    color: '#475569',
  },
  textLow: {
    color: '#DC2626',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  priceLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  sellingVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 2,
  },
  marginVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#059669',
    marginTop: 2,
  },
});
