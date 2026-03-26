import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as LocalAuthentication from 'expo-local-authentication';
import { useTheme } from '../../src/theme';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { router } from 'expo-router';
import Input from '../../src/components/ui/Input';
import Button from '../../src/components/ui/Button';

export default function LoginScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const loginAsync = useAuthStore((s) => s.loginAsync);
  const biometricLoginAsync = useAuthStore((s) => s.biometricLoginAsync);
  const storedUser = useAuthStore((s) => s.user);
  const authError = useAuthStore((s) => s.error);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [biometricType, setBiometricType] = useState<LocalAuthentication.AuthenticationType | null>(null);
  const [biometricLoading, setBiometricLoading] = useState(false);

  const styles = createStyles(theme);

  // Check if biometric hardware is available and enrolled
  useEffect(() => {
    (async () => {
      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        if (hasHardware && isEnrolled && storedUser) {
          const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
          // Prefer Face ID (type 2) over fingerprint (type 1)
          const preferred = types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)
            ? LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION
            : types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)
            ? LocalAuthentication.AuthenticationType.FINGERPRINT
            : null;
          setBiometricType(preferred);
        }
      } catch {
        // Biometric check failed silently — continue with password login
      }
    })();
  }, [storedUser]);

  const handleBiometricLogin = async () => {
    setBiometricLoading(true);
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: t('auth.biometricPrompt') || 'Verify your identity',
        cancelLabel: t('common.cancel') || 'Cancel',
        fallbackLabel: t('auth.usePassword') || 'Use Password',
        disableDeviceFallback: false,
      });
      if (result.success) {
        await biometricLoginAsync();
        router.replace('/(tabs)');
      }
    } catch {
      // Ignore — user can fall back to password
    } finally {
      setBiometricLoading(false);
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    try {
      await loginAsync(email, password);
      router.replace('/(tabs)');
    } catch {
      // Error is stored in the auth store's `error` field
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo Area */}
          <View style={styles.logoArea}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>FM</Text>
            </View>
            <Text style={styles.title}>
              {t('common.appName')}
            </Text>
            <Text style={styles.subtitle}>
              {t('onboarding.welcomeSubtitle')}
            </Text>
          </View>

          {/* Form */}
          <View style={styles.formArea}>
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="your@email.com"
              keyboardType="email-address"
            />
            <Input
              label={t('settings.notifications') === 'Notifications' ? 'Password' : 'Parola'}
              value={password}
              onChangeText={setPassword}
              placeholder="********"
              secureTextEntry
            />

            {authError ? (
              <Text style={{ color: theme.colors.error ?? '#ef4444', marginBottom: 8, textAlign: 'center' }}>
                {authError}
              </Text>
            ) : null}

            <Button
              title={loading ? t('common.loading') : 'Login'}
              onPress={handleLogin}
              loading={loading}
              fullWidth
              size="lg"
              disabled={!email || !password}
            />

            <Pressable style={styles.forgotButton}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </Pressable>
          </View>

          {/* Biometric login */}
          {biometricType !== null && (
            <View style={styles.biometricArea}>
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>
              <Pressable
                style={styles.biometricButton}
                onPress={handleBiometricLogin}
                disabled={biometricLoading}
              >
                <Text style={styles.biometricIcon}>
                  {biometricType === LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION ? '🪪' : '🫆'}
                </Text>
                <Text style={styles.biometricText}>
                  {biometricLoading
                    ? (t('common.loading') || 'Verifying…')
                    : biometricType === LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION
                    ? (t('auth.faceId') || 'Sign in with Face ID')
                    : (t('auth.fingerprint') || 'Sign in with Fingerprint')}
                </Text>
              </Pressable>
            </View>
          )}

          {/* Register Link */}
          <View style={styles.bottomArea}>
            {biometricType === null && (
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>
            )}

            <Pressable
              style={styles.registerButton}
              onPress={() => router.push('/(auth)/register')}
            >
              <Text style={styles.registerText}>
                Don't have an account?{' '}
                <Text style={styles.registerAccent}>Register</Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>['theme']) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    flex: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: theme.spacing.sectionGap,
      justifyContent: 'center',
    },
    logoArea: {
      alignItems: 'center',
      paddingTop: 40,
      paddingBottom: 40,
    },
    logoCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
    },
    logoText: {
      fontSize: 28,
      fontWeight: '800',
      color: theme.colors.background,
    },
    title: {
      ...theme.typography.h1,
      color: theme.colors.text,
      marginBottom: 8,
    },
    subtitle: {
      ...theme.typography.body,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    formArea: {
      paddingBottom: 24,
    },
    forgotButton: {
      alignItems: 'center',
      marginTop: 16,
    },
    forgotText: {
      ...theme.typography.small,
      color: theme.colors.primary,
      fontWeight: '600',
    },
    bottomArea: {
      paddingBottom: 32,
      gap: 20,
    },
    dividerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: theme.colors.border,
    },
    dividerText: {
      ...theme.typography.caption,
      color: theme.colors.textTertiary,
      fontWeight: '600',
    },
    registerButton: {
      alignItems: 'center',
      paddingVertical: 8,
    },
    registerText: {
      ...theme.typography.body,
      color: theme.colors.textSecondary,
    },
    registerAccent: {
      color: theme.colors.primary,
      fontWeight: '700',
    },
    biometricArea: {
      paddingBottom: 8,
      gap: 16,
    },
    biometricButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      paddingVertical: 14,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary + '15',
    },
    biometricIcon: {
      fontSize: 22,
    },
    biometricText: {
      ...theme.typography.body,
      color: theme.colors.primary,
      fontWeight: '700',
    },
  });
