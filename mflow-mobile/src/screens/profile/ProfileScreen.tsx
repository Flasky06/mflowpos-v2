import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Modal,
  FlatList,
  Alert,
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { User, Store, LogOut, ShieldCheck, ChevronRight, Check } from 'lucide-react-native';

export const ProfileScreen: React.FC = () => {
  const { user, shops, activeShopId, setActiveShopId, logout } = useAuthStore();
  const [isShopModalOpen, setIsShopModalOpen] = useState(false);

  const activeShop = shops.find((s) => s.id === activeShopId);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of MFlow POS?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => logout() },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* User Badge Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <User size={32} color="#4F46E5" />
          </View>
          <Text style={styles.userName}>{user?.fullName || 'Active Staff'}</Text>
          <Text style={styles.userEmail}>{user?.email || 'staff@mflowpos.com'}</Text>
          <View style={styles.roleBadge}>
            <ShieldCheck size={14} color="#4F46E5" style={{ marginRight: 4 }} />
            <Text style={styles.roleText}>{user?.role?.replace('_', ' ') || 'STAFF'}</Text>
          </View>
        </View>

        {/* Active Branch Switcher */}
        <Text style={styles.sectionTitle}>Active Location & Branch</Text>
        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => setIsShopModalOpen(true)}
          activeOpacity={0.7}
        >
          <View style={styles.menuIconBox}>
            <Store size={20} color="#4F46E5" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuLabel}>Shop Location</Text>
            <Text style={styles.menuValue}>
              {activeShop?.name || 'Default Branch Location'}
            </Text>
          </View>
          <ChevronRight size={20} color="#94A3B8" />
        </TouchableOpacity>

        {/* Subscription Info (Read-Only to comply with Play Store policies) */}
        <Text style={styles.sectionTitle}>Business Subscription Status</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Subscription Status</Text>
            <Text style={styles.infoBadgeActive}>ACTIVE</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Business Name</Text>
            <Text style={styles.infoVal}>{user?.businessName || 'MFlow Business'}</Text>
          </View>
          <Text style={styles.googleNotice}>
            Note: Subscription management is handled via the web portal to comply with App Store & Play Store guidelines.
          </Text>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <LogOut size={20} color="#EF4444" style={{ marginRight: 8 }} />
          <Text style={styles.logoutBtnText}>Sign Out of Terminal</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Branch Selection Modal */}
      <Modal visible={isShopModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select Branch Location</Text>
            <Text style={styles.modalSubtitle}>Switch your active POS branch</Text>

            <FlatList
              data={shops}
              keyExtractor={(item) => item.id}
              style={{ marginVertical: 12 }}
              renderItem={({ item }) => {
                const isSelected = item.id === activeShopId;
                return (
                  <TouchableOpacity
                    style={[styles.shopItem, isSelected && styles.shopItemActive]}
                    onPress={async () => {
                      await setActiveShopId(item.id);
                      setIsShopModalOpen(false);
                    }}
                  >
                    <Store size={18} color={isSelected ? '#4F46E5' : '#64748B'} />
                    <Text style={[styles.shopName, isSelected && styles.shopNameActive]}>
                      {item.name}
                    </Text>
                    {isSelected ? <Check size={20} color="#4F46E5" /> : null}
                  </TouchableOpacity>
                );
              }}
            />

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setIsShopModalOpen(false)}
            >
              <Text style={styles.closeBtnText}>Cancel</Text>
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
  scrollContent: {
    padding: 20,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  userName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
  },
  userEmail: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 12,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#4F46E5',
    textTransform: 'uppercase',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 4,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  menuIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  menuLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  menuValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  infoVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  infoBadgeActive: {
    backgroundColor: '#D1FAE5',
    color: '#047857',
    fontSize: 11,
    fontWeight: '900',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
  googleNotice: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 8,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    height: 52,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  logoutBtnText: {
    color: '#EF4444',
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
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 12,
  },
  shopItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  shopItemActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#4F46E5',
  },
  shopName: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  shopNameActive: {
    color: '#4F46E5',
    fontWeight: '900',
  },
  closeBtn: {
    backgroundColor: '#F1F5F9',
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  closeBtnText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
  },
});
