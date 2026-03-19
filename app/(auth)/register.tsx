import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../src/theme';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { router } from 'expo-router';
import Input from '../../src/components/ui/Input';
import Button from '../../src/components/ui/Button';

export default function RegisterScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const registerAsync = useAuthStore((s) => s.registerAsync);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const styles = createStyles(theme);
  const passwordsMatch = password === confirmPassword;
  const isValid = name && email && password && confirmPassword && passwordsMatch;

  const handleRegister = async () => {
    if (!isValid) return;
    setLoading(true);
    try {
      await registerAsync(name, email, password);
      router.replace('/onboarding');
    } catch {
      // Error stored in auth store
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
          {/* Header */}
          <View style={styles.headerArea}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>FM</Text>
            </View>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join the FitMaster community</Text>
          </View>

          {/* Form */}
          <View style={styles.formArea}>
            <Input
              label="Full Name"
              value={name}
              onChangeText={setName}
              placeholder="John Doe"
            />
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="your@email.com"
              keyboardType="email-address"
            />
            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Min. 8 characters"
              secureTextEntry
            />
            <Input
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Repeat your password"
              secureTextEntry
              error={confirmPassword && !passwordsMatch ? 'Passwords do not match' : undefined}
            />

            <Button
              title={loading ? t('common.loading') : 'Create Account'}
              onPress={handleRegister}
              loading={loading}
              fullWidth
              size="lg"
              disabled={!isValid}
            />
          </View>

          {/* Login Link */}
          <View style={styles.bottomArea}>
            <Pressable
              style={styles.loginButton}
              onPress={() => router.back()}
            >
              <Text style={styles.loginText}>
                Already have an account?{' '}
                <Text style={styles.loginAccent}>Login</Text>
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
    },
    headerArea: {
      alignItems: 'center',
      paddingTop: 32,
      paddingBottom: 32,
    },
    logoCircle: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: theme.colors.secondary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    logoText: {
      fontSize: 22,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    title: {
      ...theme.typography.h2,
      color: theme.colors.text,
      marginBottom: 6,
    },
    subtitle: {
      ...theme.typography.body,
      color: theme.colors.textSecondary,
    },
    formArea: {
      paddingBottom: 24,
    },
    bottomArea: {
      paddingBottom: 32,
      alignItems: 'center',
    },
    loginButton: {
      paddingVertical: 8,
    },
    loginText: {
      ...theme.typography.body,
      color: theme.colors.textSecondary,
    },
    loginAccent: {
      color: theme.colors.primary,
      fontWeight: '700',
    },
  });
