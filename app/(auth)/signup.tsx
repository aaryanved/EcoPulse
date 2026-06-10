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
import { useAuth } from '@/hooks/useAuth';
import { Colors, Spacing } from '@/constants/theme';

interface FormData {
  displayName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  displayName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export default function SignupScreen() {
  const { register, isLoading } = useAuth();
  const [form, setForm] = useState<FormData>({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  function setField<K extends keyof FormData>(key: K, value: string) {
    setForm(f => ({ ...f, [key]: value }));
    if (errors[key]) setErrors(e => ({ ...e, [key]: undefined }));
  }

  function validate(): boolean {
    const newErrors: FormErrors = {};
    if (!form.displayName.trim()) newErrors.displayName = 'Name is required';
    if (!form.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'Enter a valid email';
    if (!form.password) newErrors.password = 'Password is required';
    else if (form.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (form.password !== form.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSignup() {
    if (!validate()) return;
    try {
      await register(form.email.trim().toLowerCase(), form.password, form.displayName.trim());
      router.replace('/(onboarding)/transport');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Signup failed';
      Alert.alert('Sign Up Failed', message);
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
              Join EcoPulse
            </Text>
            <Text variant="body" color="muted">
              Start your sustainability journey
            </Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Full Name"
              placeholder="Your name"
              autoCapitalize="words"
              value={form.displayName}
              onChangeText={v => setField('displayName', v)}
              error={errors.displayName}
              leftIcon="account-outline"
            />
            <Input
              label="Email"
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={form.email}
              onChangeText={v => setField('email', v)}
              error={errors.email}
              leftIcon="email-outline"
            />
            <Input
              label="Password"
              placeholder="Min 8 characters"
              value={form.password}
              onChangeText={v => setField('password', v)}
              error={errors.password}
              leftIcon="lock-outline"
              secureToggle
              secureTextEntry
            />
            <Input
              label="Confirm Password"
              placeholder="Repeat your password"
              value={form.confirmPassword}
              onChangeText={v => setField('confirmPassword', v)}
              error={errors.confirmPassword}
              leftIcon="lock-check-outline"
              secureToggle
              secureTextEntry
            />

            <Button
              onPress={handleSignup}
              loading={isLoading}
              fullWidth
              size="lg"
              style={styles.signupButton}
            >
              Create Account
            </Button>

            <View style={styles.loginRow}>
              <Text variant="body" color="muted">
                Already have an account?{' '}
              </Text>
              <Link href="/(auth)/login">
                <Text variant="body" color="secondary" weight="semibold">
                  Sign In
                </Text>
              </Link>
            </View>

            <Text variant="caption" color="dim" style={styles.terms}>
              By creating an account, you agree to our Terms of Service and Privacy Policy.
            </Text>
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
    marginBottom: Spacing['2xl'],
    gap: Spacing.xs,
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
  },
  form: {
    gap: Spacing.xs,
  },
  signupButton: {
    marginTop: Spacing.md,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  terms: {
    textAlign: 'center',
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.base,
  },
});
