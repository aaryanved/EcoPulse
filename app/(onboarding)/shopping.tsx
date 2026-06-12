import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { OnboardingOption } from '@/components/forms/OnboardingOption';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useAuth } from '@/hooks/useAuth';
import { Colors, Spacing } from '@/constants/theme';
import type { ShoppingFrequency } from '@/types';

const SHOPPING_OPTIONS: Array<{
  value: ShoppingFrequency;
  icon: string;
  label: string;
  description: string;
}> = [
  { value: 'rarely', icon: 'cart-off', label: 'Rarely', description: 'I shop very minimally' },
  { value: 'monthly', icon: 'calendar-month', label: 'Monthly', description: 'A few times per month' },
  { value: 'weekly', icon: 'cart', label: 'Weekly', description: 'Regular weekly shopping' },
  { value: 'daily', icon: 'cart-plus', label: 'Frequently', description: 'I shop often' },
];

export default function ShoppingOnboarding() {
  const { data, setField, prevStep, reset } = useOnboardingStore();
  const { saveProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  async function handleComplete() {
    if (!data.shopping_frequency) return;
    setIsLoading(true);
    try {
      await saveProfile({
        transport_mode: (data.transport_mode ?? 'mixed') as import('@/types').TransportMode,
        diet_type: (data.diet_type ?? 'omnivore') as import('@/types').DietType,
        energy_source: (data.energy_source ?? 'grid') as import('@/types').EnergySource,
        shopping_frequency: (data.shopping_frequency ?? 'monthly') as import('@/types').ShoppingFrequency,
        monthly_carbon_goal: data.monthly_goal ?? 200,
        onboarding_completed: true,
      });
      reset();
      router.replace('/(tabs)/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save profile';
      Alert.alert('Error', message);
    } finally {
      setIsLoading(false);
    }
  }

  function handleBack() {
    prevStep();
    router.back();
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.progressWrapper}>
          <ProgressBar progress={1} animated />
          <Text variant="caption" color="muted">
            Step 4 of 4
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleSection}>
          <Text variant="heading">Shopping habits</Text>
          <Text variant="body" color="muted">
            Consumer goods contribute significantly to personal carbon footprints.
          </Text>
        </View>

        <View style={styles.options}>
          {SHOPPING_OPTIONS.map(option => (
            <OnboardingOption
              key={option.value}
              icon={option.icon}
              label={option.label}
              description={option.description}
              selected={data.shopping_frequency === option.value}
              onSelect={() => setField('shopping_frequency', option.value)}
            />
          ))}
        </View>

        <View style={styles.readyCard}>
          <Text variant="title" color="secondary">
            You're all set! 🌿
          </Text>
          <Text variant="body" color="muted">
            We'll personalize your dashboard and recommendations based on your profile.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button variant="outline" onPress={handleBack} style={styles.backButton}>
          Back
        </Button>
        <Button
          onPress={handleComplete}
          disabled={!data.shopping_frequency}
          loading={isLoading}
          style={styles.nextButton}
          size="lg"
        >
          Start Tracking
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  header: {
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing.base,
    paddingBottom: Spacing.md,
  },
  progressWrapper: {
    gap: Spacing.xs,
  },
  content: {
    paddingHorizontal: Spacing['2xl'],
    paddingBottom: Spacing['2xl'],
    gap: Spacing['2xl'],
  },
  titleSection: {
    gap: Spacing.sm,
  },
  options: {
    gap: Spacing.md,
  },
  readyCard: {
    backgroundColor: `${Colors.emerald[500]}10`,
    borderRadius: 16,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: `${Colors.emerald[500]}30`,
    gap: Spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing['2xl'],
    paddingBottom: Spacing['2xl'],
    paddingTop: Spacing.base,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    gap: Spacing.md,
  },
  backButton: {
    flex: 1,
  },
  nextButton: {
    flex: 2,
  },
});
