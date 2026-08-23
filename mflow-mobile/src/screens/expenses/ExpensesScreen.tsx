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
  Alert,
  SafeAreaView,
} from 'react-native';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { Search, Plus, TrendingDown, X, DollarSign } from 'lucide-react-native';

export const ExpensesScreen: React.FC = () => {
  const { activeShopId } = useAuthStore();

  const [expenses, setExpenses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Record Expense Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [categoryId, setCategoryId] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchExpenses = async () => {
    setIsLoading(true);
    try {
      const shopQuery = activeShopId ? `?shopId=${activeShopId}` : '';
      const [expRes, catRes] = await Promise.all([
        apiClient.get(`/expenses${shopQuery}`),
        apiClient.get('/expenses/categories').catch(() => ({ data: { data: [] } })),
      ]);

      const list = expRes.data?.data?.expenses || expRes.data?.data || [];
      const catList = catRes.data?.data || [];
      setExpenses(Array.isArray(list) ? list : []);
      setCategories(Array.isArray(catList) ? catList : []);
      if (catList.length > 0 && !categoryId) {
        setCategoryId(catList[0].id);
      }
    } catch (e) {
      console.error('Failed to fetch mobile expenses:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [activeShopId]);

  const handleRecordExpense = async () => {
    if (!title.trim() || !amount) {
      Alert.alert('Validation Error', 'Please fill in both title and amount.');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post('/expenses', {
        title: title.trim(),
        amount: parseFloat(amount),
        paymentMethod,
        categoryId: categoryId || undefined,
        notes: notes.trim() || undefined,
        shopId: activeShopId || undefined,
      });

      Alert.alert('Expense Recorded', `Successfully recorded '${title}' (KES ${Number(amount).toLocaleString()})`);
      setIsModalOpen(false);
      setTitle('');
      setAmount('');
      setNotes('');
      fetchExpenses();
    } catch (e: any) {
      Alert.alert('Save Error', e.response?.data?.message || 'Could not save expense.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredExpenses = expenses.filter(
    (e) =>
      e.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.category?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalExpenseSum = filteredExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Bar */}
      <View style={styles.headerBar}>
        <View style={styles.searchBox}>
          <Search size={18} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search expenses by title..."
            placeholderTextColor="#94A3B8"
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>

        <TouchableOpacity style={styles.addBtn} onPress={() => setIsModalOpen(true)}>
          <Plus size={18} color="#FFFFFF" />
          <Text style={styles.addBtnText}>Record</Text>
        </TouchableOpacity>
      </View>

      {/* Summary KPI */}
      <View style={styles.kpiCard}>
        <View style={styles.kpiIconBox}>
          <TrendingDown size={20} color="#E11D48" />
        </View>
        <View>
          <Text style={styles.kpiLabel}>Total Outflows Logged</Text>
          <Text style={styles.kpiVal}>KES {totalExpenseSum.toLocaleString()}</Text>
        </View>
      </View>

      {/* Expense Outflows List */}
      {isLoading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator color="#4F46E5" size="large" />
        </View>
      ) : (
        <FlatList
          data={filteredExpenses}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <View style={styles.expenseCard}>
              <View style={styles.rowTop}>
                <Text style={styles.expenseTitle}>{item.title}</Text>
                <Text style={styles.expenseAmt}>KES {Number(item.amount || 0).toLocaleString()}</Text>
              </View>

              <View style={styles.rowBottom}>
                <Text style={styles.catBadge}>{item.category?.name || 'General Expense'}</Text>
                <Text style={styles.dateText}>
                  {new Date(item.createdAt || item.expenseDate).toLocaleDateString()}
                </Text>
              </View>
            </View>
          )}
        />
      )}

      {/* Record Expense Modal */}
      <Modal visible={isModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Record New Expense</Text>
              <TouchableOpacity onPress={() => setIsModalOpen(false)}>
                <X size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Title Input */}
            <Text style={styles.label}>Expense Title</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Shop Electricity Bill"
              placeholderTextColor="#94A3B8"
              value={title}
              onChangeText={setTitle}
            />

            {/* Amount Input */}
            <Text style={styles.label}>Amount Outflow (KES)</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor="#94A3B8"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />

            {/* Category Dropdown/Selector */}
            {categories.length > 0 ? (
              <>
                <Text style={styles.label}>Category</Text>
                <View style={styles.catRow}>
                  {categories.slice(0, 4).map((c) => (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.catChip, categoryId === c.id && styles.catChipActive]}
                      onPress={() => setCategoryId(c.id)}
                    >
                      <Text style={[styles.catChipText, categoryId === c.id && styles.catChipTextActive]}>
                        {c.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            ) : null}

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitBtn, isSubmitting && { opacity: 0.6 }]}
              onPress={handleRecordExpense}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>Save Outflow Record</Text>
              )}
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
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 10,
  },
  searchBox: {
    flex: 1,
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
  addBtn: {
    backgroundColor: '#E11D48',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  kpiCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 14,
  },
  kpiIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFE4E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  kpiVal: {
    fontSize: 20,
    fontWeight: '900',
    color: '#E11D48',
    marginTop: 2,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContainer: {
    padding: 16,
  },
  expenseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  expenseTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  expenseAmt: {
    fontSize: 16,
    fontWeight: '900',
    color: '#E11D48',
  },
  rowBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  catBadge: {
    backgroundColor: '#F1F5F9',
    color: '#475569',
    fontSize: 11,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
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
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    height: 48,
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
  },
  catRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 6,
  },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  catChipActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#4F46E5',
  },
  catChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  catChipTextActive: {
    color: '#4F46E5',
    fontWeight: '900',
  },
  submitBtn: {
    backgroundColor: '#E11D48',
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
