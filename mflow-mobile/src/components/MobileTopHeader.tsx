import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  FlatList,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { useAuthStore } from '../store/authStore';
import { Bell, Store, Maximize, Minimize, X, AlertTriangle, CheckCircle2, ShieldCheck } from 'lucide-react-native';

export const MobileTopHeader: React.FC = () => {
  const { user, shops, activeShopId, setActiveShopId, getSubscriptionInfo } = useAuthStore();
  const subInfo = getSubscriptionInfo();

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const activeShop = shops.find((s) => s.id === activeShopId);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    if (Platform.OS === 'android') {
      StatusBar.setHidden(!isFullscreen);
    }
  };

  // Mock notifications / system alerts
  const notifications = [
    ...(subInfo.isExpired
      ? [
          {
            id: 'sub-exp',
            title: 'Subscription Expired',
            message: 'Your business subscription has expired. Please renew via the web portal.',
            type: 'WARNING' as const,
            time: 'Just now',
          },
        ]
      : []),
    {
      id: 'n1',
      title: 'POS Terminal Ready',
      message: `Active branch: ${activeShop?.name || 'Main Branch'}`,
      type: 'INFO' as const,
      time: 'Today',
    },
    {
      id: 'n2',
      title: 'Real-time Sync Active',
      message: 'All mobile sales auto-sync with the MFlow web backend.',
      type: 'SUCCESS' as const,
      time: 'Today',
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topHeaderBar}>
        {/* Left: Active Branch Badge */}
        <View style={styles.branchBox}>
          <Store size={18} color="#818CF8" />
          <View style={{ marginLeft: 8 }}>
            <Text style={styles.branchTitle} numberOfLines={1}>
              {activeShop?.name || user?.businessName || 'MFlow POS'}
            </Text>
            <Text style={styles.branchSubtitle}>
              {user?.fullName ? `${user.fullName} (${user.role || 'STAFF'})` : 'Mobile Terminal'}
            </Text>
          </View>
        </View>

        {/* Right: Actions (Subscription Badge, Notifications, Fullscreen Toggle) */}
        <View style={styles.actionGroup}>
          {/* Subscription Status Pill */}
          <View
            style={[
              styles.subPill,
              subInfo.isExpired ? styles.subPillExpired : styles.subPillActive,
            ]}
          >
            <Text
              style={[
                styles.subPillText,
                subInfo.isExpired ? styles.subTextExpired : styles.subTextActive,
              ]}
            >
              {subInfo.isExpired ? 'EXPIRED' : 'ACTIVE'}
            </Text>
          </View>

          {/* Notifications Icon with Badge */}
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setIsNotificationsOpen(true)}
            activeOpacity={0.7}
          >
            <Bell size={20} color="#CBD5E1" />
            {notifications.length > 0 ? (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>{notifications.length}</Text>
              </View>
            ) : null}
          </TouchableOpacity>

          {/* Fullscreen Toggle Icon */}
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={toggleFullscreen}
            activeOpacity={0.7}
          >
            {isFullscreen ? (
              <Minimize size={20} color="#818CF8" />
            ) : (
              <Maximize size={20} color="#CBD5E1" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Notifications Drawer Modal */}
      <Modal visible={isNotificationsOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Bell size={20} color="#4F46E5" />
                <Text style={styles.modalTitle}>System Notifications</Text>
              </View>
              <TouchableOpacity onPress={() => setIsNotificationsOpen(false)}>
                <X size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={notifications}
              keyExtractor={(item) => item.id}
              style={{ marginVertical: 8 }}
              renderItem={({ item }) => (
                <View style={styles.notifRow}>
                  {item.type === 'WARNING' ? (
                    <AlertTriangle size={20} color="#D97706" style={{ marginTop: 2 }} />
                  ) : item.type === 'SUCCESS' ? (
                    <CheckCircle2 size={20} color="#059669" style={{ marginTop: 2 }} />
                  ) : (
                    <ShieldCheck size={20} color="#4F46E5" style={{ marginTop: 2 }} />
                  )}
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={styles.notifItemTitle}>{item.title}</Text>
                      <Text style={styles.notifItemTime}>{item.time}</Text>
                    </View>
                    <Text style={styles.notifItemMsg}>{item.message}</Text>
                  </View>
                </View>
              )}
            />

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setIsNotificationsOpen(false)}
            >
              <Text style={styles.closeBtnText}>Dismiss Notifications</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#0F172A',
  },
  topHeaderBar: {
    height: 56,
    backgroundColor: '#0F172A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  branchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  branchTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  branchSubtitle: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: 1,
  },
  actionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  subPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  subPillActive: {
    backgroundColor: '#064E3B',
  },
  subPillExpired: {
    backgroundColor: '#78350F',
  },
  subPillText: {
    fontSize: 9,
    fontWeight: '900',
  },
  subTextActive: {
    color: '#34D399',
  },
  subTextExpired: {
    color: '#FDE68A',
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notifBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  notifBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
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
    maxHeight: '75%',
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
  notifRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  notifItemTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  notifItemTime: {
    fontSize: 10,
    color: '#94A3B8',
  },
  notifItemMsg: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 16,
  },
  closeBtn: {
    backgroundColor: '#0F172A',
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  closeBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
