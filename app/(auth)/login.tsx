import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../src/theme';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { router } from 'expo-router';
import Input from '../../src/components/ui/Input';
import Button from '../../src/components/ui/Button';

export default function LoginScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const login = useAuthStore((s) => s.login);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const styles = createStyles(theme);

  const handleLogin = () => {
    setLoading(true);
    setTimeout(() => {
      login(email, password);
      setLoading(false);
      router.replace('/(tabs)');
    }, 800);
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

          {/* Register Link */}
          <View style={styles.bottomArea}>
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

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
  });
