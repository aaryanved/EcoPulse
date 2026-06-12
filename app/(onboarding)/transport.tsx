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
import type { TransportMode } from '@/types';

const TRANSPORT_OPTIONS: Array<{
  value: TransportMode;
  icon: string;
  label: string;
  description: string;
}> = [
  { value: 'car', icon: 'car', label: 'Car', description: 'I drive regularly' },
  { value: 'public_transit', icon: 'bus', label: 'Public Transit', description: 'Bus, train, subway' },
  { value: 'cycling', icon: 'bicycle', label: 'Cycling', description: 'Bike as main transport' },
  { value: 'walking', icon: 'walk', label: 'Walking', description: 'Walk most places' },
  { value: 'mixed', icon: 'map-marker-path', label: 'Mixed', description: 'I use various modes' },
];

export default function TransportOnboarding() {
  const { data, setField, nextStep } = useOnboardingStore();

  function handleSelect(value: TransportMode) {
    setField('transport_mode', value);
  }

  function handleNext() {
    if (!data.transport_mode) return;
    nextStep();
    router.push('/(onboarding)/diet');
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.progressWrapper}>
          <ProgressBar progress={0.25} animated />
          <Text variant="caption" color="muted">
            Step 1 of 4
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleSection}>
          <Text variant="heading">
            How do you get around?
          </Text>
          <Text variant="body" color="muted">
            This helps us calculate your transport emissions accurately.
          </Text>
        </View>

        <View style={styles.options}>
          {TRANSPORT_OPTIONS.map(option => (
            <OnboardingOption
              key={option.value}
              icon={option.icon}
              label={option.label}
              description={option.description}
              selected={data.transport_mode === option.value}
              onSelect={() => handleSelect(option.value)}
            />
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          onPress={handleNext}
          disabled={!data.transport_mode}
          fullWidth
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
    paddingHorizontal: Spacing['2xl'],
    paddingBottom: Spacing['2xl'],
    paddingTop: Spacing.base,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
});
