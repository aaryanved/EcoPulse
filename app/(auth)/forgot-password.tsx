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
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';
import { Colors, Spacing } from '@/constants/theme';

export default function ForgotPasswordScreen() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  function validate(): boolean {
    if (!email.trim()) {
      setEmailError('Email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  }

  async function handleReset() {
    if (!validate()) return;
    setIsLoading(true);
    try {
      await forgotPassword(email.trim().toLowerCase());
      setSent(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Reset failed';
      Alert.alert('Error', message);
    } finally {
      setIsLoading(false);
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
        >
          <Button
            variant="ghost"
            size="sm"
            style={styles.backButton}
            onPress={() => router.back()}
            leftIcon={<MaterialCommunityIcons name="arrow-left" size={20} color={Colors.text.secondary} />}
          >
            Back
          </Button>

          <View style={styles.content}>
            <View style={styles.iconWrapper}>
              <MaterialCommunityIcons name="lock-reset" size={40} color={Colors.emerald[500]} />
            </View>

            {sent ? (
              <View style={styles.sentContainer}>
                <MaterialCommunityIcons name="check-circle" size={64} color={Colors.success} />
                <Text variant="title" style={styles.sentTitle}>
                  Check your email
                </Text>
                <Text variant="body" color="muted" style={styles.sentDescription}>
                  We've sent a password reset link to {email}
                </Text>
                <Button
                  onPress={() => router.replace('/(auth)/login')}
                  fullWidth
                  size="lg"
                  style={styles.button}
                >
                  Back to Sign In
                </Button>
              </View>
            ) : (
              <>
                <Text variant="heading" style={styles.title}>
                  Reset password
                </Text>
                <Text variant="body" color="muted" style={styles.description}>
                  Enter your email address and we'll send you a link to reset your password.
                </Text>

                <Input
                  label="Email"
                  placeholder="you@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={v => {
                    setEmail(v);
                    if (emailError) setEmailError('');
                  }}
                  error={emailError}
                  leftIcon="email-outline"
                />

                <Button
                  onPress={handleReset}
                  loading={isLoading}
                  fullWidth
                  size="lg"
                  style={styles.button}
                >
                  Send Reset Link
                </Button>
              </>
            )}
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
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing['2xl'],
    paddingBottom: Spacing['4xl'],
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: Spacing['2xl'],
    paddingLeft: 0,
  },
  content: {
    gap: Spacing.base,
  },
  iconWrapper: {
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
  title: {
    marginBottom: Spacing.xs,
  },
  description: {
    marginBottom: Spacing.base,
  },
  button: {
    marginTop: Spacing.md,
  },
  sentContainer: {
    alignItems: 'center',
    gap: Spacing.base,
    paddingTop: Spacing.xl,
  },
  sentTitle: {
    textAlign: 'center',
  },
  sentDescription: {
    textAlign: 'center',
    maxWidth: 260,
  },
});
