import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { ShoppingBag, Lock, Mail, Eye, EyeOff } from 'lucide-react-native';

export const LoginScreen: React.FC = () => {
  const { login, isLoading } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setErrorMessage(null);
    try {
      await login(email, password);
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Brand Header */}
          <View style={styles.headerBox}>
            <View style={styles.logoBadge}>
              <ShoppingBag size={32} color="#4F46E5" />
            </View>
            <Text style={styles.brandTitle}>MFlow POS</Text>
            <Text style={styles.brandSubtitle}>Mobile POS & Retail Register</Text>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            <Text style={styles.cardHeaderTitle}>Sign In to Workspace</Text>
            <Text style={styles.cardHeaderDesc}>Enter staff or admin credentials</Text>

            {errorMessage ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Email Field */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputWrapper}>
                <Mail size={18} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="admin@mflowpos.com"
                  placeholderTextColor="#94A3B8"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            {/* Password Field */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrapper}>
                <Lock size={18} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#94A3B8"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                >
                  {showPassword ? (
                    <EyeOff size={18} color="#64748B" />
                  ) : (
                    <Eye size={18} color="#64748B" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitBtn, isLoading && styles.submitBtnDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.submitBtnText}>Sign In to Terminal</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer Info */}
          <Text style={styles.footerNote}>
            MFlow POS Mobile v2.0 · Secured API Integration
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 40,
    justifyContent: 'center',
    minHeight: '100%',
  },
  headerBox: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#818CF8',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardHeaderTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  cardHeaderDesc: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
    marginBottom: 20,
  },
  errorBox: {
    backgroundColor: '#451A03',
    borderColor: '#78350F',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#FDE68A',
    fontSize: 13,
    fontWeight: '600',
  },
  fieldGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#CBD5E1',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 48,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  eyeBtn: {
    padding: 8,
  },
  submitBtn: {
    backgroundColor: '#4F46E5',
    borderRadius: 14,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  footerNote: {
    textAlign: 'center',
    color: '#64748B',
    fontSize: 12,
    marginTop: 28,
    fontWeight: '500',
  },
});
