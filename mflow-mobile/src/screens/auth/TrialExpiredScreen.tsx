import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { Lock, LogOut, MailCheck } from 'lucide-react-native';

export const TrialExpiredScreen: React.FC = () => {
  const { user, logout } = useAuthStore();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Lock Icon */}
        <View style={styles.iconCircle}>
          <Lock size={48} color="#F59E0B" />
        </View>

        {/* Lockout Headline */}
        <Text style={styles.title}>7-Day Free Trial Expired</Text>

        <Text style={styles.subtitle}>
          The 7-day free trial period for <Text style={styles.bold}>{user?.businessName || 'your workspace'}</Text> has ended.
        </Text>

        {/* Informational Box - No Purchase Buttons to comply with Play Store rules */}
        <View style={styles.infoBox}>
          <MailCheck size={24} color="#818CF8" style={{ marginBottom: 10 }} />
          <Text style={styles.infoText}>
            We have sent an email with instructions. Please check your inbox or log into the MFlow web portal from your computer to select a plan.
          </Text>
        </View>

        {/* Sign Out Action */}
        <TouchableOpacity style={styles.logoutBtn} onPress={() => logout()}>
          <LogOut size={18} color="#EF4444" style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>Sign Out of Terminal</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
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
    backgroundColor: '#312E81',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#4338CA',
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  bold: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  infoBox: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    marginBottom: 32,
    width: '100%',
  },
  infoText: {
    color: '#CBD5E1',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#451A03',
    borderColor: '#78350F',
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    width: '100%',
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '800',
  },
});
