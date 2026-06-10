import React from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { OnboardingOption } from '@/components/forms/OnboardingOption';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { Colors, Spacing } from '@/constants/theme';
import type { DietType } from '@/types';

const DIET_OPTIONS: Array<{
  value: DietType;
  icon: string;
  label: string;
  description: string;
}> = [
  { value: 'omnivore', icon: 'food', label: 'Omnivore', description: 'I eat meat regularly' },
  { value: 'flexitarian', icon: 'food-apple', label: 'Flexitarian', description: 'Mostly plant-based, some meat' },
  { value: 'vegetarian', icon: 'leaf', label: 'Vegetarian', description: 'No meat, but dairy & eggs' },
  { value: 'vegan', icon: 'sprout', label: 'Vegan', description: 'Fully plant-based diet' },
];

export default function DietOnboarding() {
  const { data, setField, prevStep, nextStep } = useOnboardingStore();

  function handleNext() {
    if (!data.diet_type) return;
    nextStep();
    router.push('/(onboarding)/energy');
  }

  function handleBack() {
    prevStep();
    router.back();
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.progressWrapper}>
          <ProgressBar progress={0.5} animated />
          <Text variant="caption" color="muted">
            Step 2 of 4
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleSection}>
          <Text variant="heading">What's your diet?</Text>
          <Text variant="body" color="muted">
            Food choices account for up to 26% of the average carbon footprint.
          </Text>
        </View>

        <View style={styles.options}>
          {DIET_OPTIONS.map(option => (
            <OnboardingOption
              key={option.value}
              icon={option.icon}
              label={option.label}
              description={option.description}
              selected={data.diet_type === option.value}
              onSelect={() => setField('diet_type', option.value)}
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
          disabled={!data.diet_type}
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
