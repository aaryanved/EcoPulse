import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';
import { Text } from './Text';

interface Props {
  label?: string;
  marginVertical?: number;
}

export function Divider({ label, marginVertical = Spacing.base }: Props) {
  if (label) {
    return (
      <View style={[styles.withLabel, { marginVertical }]}>
        <View style={styles.line} />
        <Text variant="caption" color="dim" style={styles.labelText}>
          {label}
        </Text>
        <View style={styles.line} />
      </View>
    );
  }

  return <View style={[styles.simple, { marginVertical }]} />;
}

const styles = StyleSheet.create({
  simple: {
    height: 1,
    backgroundColor: Colors.divider,
  },
  withLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.divider,
  },
  labelText: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
