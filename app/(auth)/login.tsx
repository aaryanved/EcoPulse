import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Divider } from '@/components/ui/Divider';
import { useAuth } from '@/hooks/useAuth';
import { Colors, Spacing, FontSize } from '@/constants/theme';

export default function LoginScreen() {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  function validate(): boolean {
    const newErrors: typeof errors = {};
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Enter a valid email';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleLogin() {
    if (!validate()) return;
    try {
      await login(email.trim().toLowerCase(), password);
      router.replace('/');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      Alert.alert('Login Failed', message);
    }
  }

  return (
    <LinearGradient
      colors={[Colors.background.primary, Colors.background.secondary, Colors.background.primary]}
      style={styles.gradient}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.logoWrapper}>
              <MaterialCommunityIcons name="leaf" size={40} color={Colors.emerald[500]} />
            </View>
            <Text variant="heading" style={styles.appName}>
              EcoPulse
            </Text>
            <Text variant="body" color="muted" style={styles.tagline}>
              Track your carbon footprint
            </Text>
          </View>

          <View style={styles.form}>
            <Text variant="title" style={styles.formTitle}>
              Welcome back
            </Text>
            <Text variant="body" color="muted" style={styles.formSubtitle}>
              Sign in to continue your journey
            </Text>

            <View style={styles.fields}>
              <Input
                label="Email"
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
                error={errors.email}
                leftIcon="email-outline"
              />
              <Input
                label="Password"
                placeholder="Your password"
                value={password}
                onChangeText={setPassword}
                error={errors.password}
                leftIcon="lock-outline"
                secureToggle
                secureTextEntry
              />
              <Link href="/(auth)/forgot-password" style={styles.forgotLink}>
                <Text variant="caption" color="secondary">
                  Forgot password?
                </Text>
              </Link>
            </View>

            <Button
              onPress={handleLogin}
              loading={isLoading}
              fullWidth
              size="lg"
              style={styles.loginButton}
            >
              Sign In
            </Button>

            <Divider label="or" />

            <View style={styles.signupRow}>
              <Text variant="body" color="muted">
                Don't have an account?{' '}
              </Text>
              <Link href="/(auth)/signup">
                <Text variant="body" color="secondary" weight="semibold">
                  Sign Up
                </Text>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing['4xl'],
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing['3xl'],
  },
  logoWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: `${Colors.emerald[500]}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: `${Colors.emerald[500]}40`,
  },
  appName: {
    color: Colors.emerald[400],
    letterSpacing: 1,
  },
  tagline: {
    marginTop: Spacing.xs,
  },
  form: {
    gap: Spacing.base,
  },
  formTitle: {
    marginBottom: Spacing.xs,
  },
  formSubtitle: {
    marginBottom: Spacing.md,
  },
  fields: {
    gap: 0,
  },
  forgotLink: {
    alignSelf: 'flex-end',
    marginTop: -Spacing.sm,
    marginBottom: Spacing.sm,
  },
  loginButton: {
    marginTop: Spacing.xs,
  },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
});
