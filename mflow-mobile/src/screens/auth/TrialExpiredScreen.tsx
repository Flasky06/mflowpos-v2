import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { Lock, LogOut, MailCheck, AlertTriangle } from 'lucide-react-native';

export const TrialExpiredScreen: React.FC = () => {
  const { user, logout, getSubscriptionInfo } = useAuthStore();
  const subInfo = getSubscriptionInfo();

  const isTrial = subInfo.isTrial;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Lock Icon */}
        <View style={styles.iconCircle}>
          <Lock size={48} color="#D97706" />
        </View>

        {/* Lockout Headline */}
        <Text style={styles.title}>
          {isTrial ? '7-Day Free Trial Ended' : 'Subscription Expired'}
        </Text>

        <Text style={styles.subtitle}>
          The {isTrial ? '7-day free trial' : 'subscription'} for{' '}
          <Text style={styles.bold}>{user?.businessName || user?.business?.name || 'your workspace'}</Text>{' '}
          is no longer active.
        </Text>

        {/* Informational Box - Strict Google Play & App Store Compliance */}
        <View style={styles.infoBox}>
          {isTrial ? (
            <MailCheck size={26} color="#4F46E5" style={{ marginBottom: 12 }} />
          ) : (
            <AlertTriangle size={26} color="#D97706" style={{ marginBottom: 12 }} />
          )}
          <Text style={styles.infoText}>
            {subInfo.message ||
              'Please log into the MFlow web portal from your web browser to renew your workspace.'}
          </Text>
        </View>

        {/* Sign Out Action */}
        <TouchableOpacity style={styles.logoutBtn} onPress={() => logout()}>
          <LogOut size={18} color="#991B1B" style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>Sign Out of Terminal</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  bold: {
    color: '#0F172A',
    fontWeight: '700',
  },
  infoBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    marginBottom: 32,
    width: '100%',
  },
  infoText: {
    color: '#334155',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    width: '100%',
  },
  logoutText: {
    color: '#991B1B',
    fontSize: 14,
    fontWeight: '800',
  },
});
