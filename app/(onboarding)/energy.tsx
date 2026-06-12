import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { OnboardingOption } from '@/components/forms/OnboardingOption';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { Colors, Spacing } from '@/constants/theme';
import type { EnergySource } from '@/types';

const ENERGY_OPTIONS: Array<{
  value: EnergySource;
  icon: string;
  label: string;
  description: string;
}> = [
  { value: 'grid', icon: 'transmission-tower', label: 'Grid Electricity', description: 'Standard utility power' },
  { value: 'solar', icon: 'solar-panel', label: 'Solar', description: 'Rooftop or community solar' },
  { value: 'wind', icon: 'wind-turbine', label: 'Wind', description: 'Wind energy tariff' },
  { value: 'mixed_renewable', icon: 'leaf-circle', label: 'Mixed Renewable', description: 'Green energy plan' },
  { value: 'unknown', icon: 'help-circle-outline', label: 'Not Sure', description: 'I don\'t know my source' },
];

export default function EnergyOnboarding() {
  const { data, setField, prevStep, nextStep } = useOnboardingStore();

  function handleNext() {
    if (!data.energy_source) return;
    nextStep();
    router.push('/(onboarding)/shopping');
  }

  function handleBack() {
    prevStep();
    router.back();
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.progressWrapper}>
          <ProgressBar progress={0.75} animated />
          <Text variant="caption" color="muted">
            Step 3 of 4
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleSection}>
          <Text variant="heading">Your energy source</Text>
          <Text variant="body" color="muted">
            Electricity generation varies massively in carbon intensity by source.
          </Text>
        </View>

        <View style={styles.options}>
          {ENERGY_OPTIONS.map(option => (
            <OnboardingOption
              key={option.value}
              icon={option.icon}
              label={option.label}
              description={option.description}
              selected={data.energy_source === option.value}
              onSelect={() => setField('energy_source', option.value)}
            />
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button variant="outline" onPress={handleBack} style={styles.backButton}>
          Back
        </Button>
        <Button
          onPress={handleNext}
          disabled={!data.energy_source}
          style={styles.nextButton}
          size="lg"
        >
          Continue
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
