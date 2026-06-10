import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';
import { Text } from './Text';

interface Props {
  size?: 'small' | 'large';
  color?: string;
  fullScreen?: boolean;
  label?: string;
}

export function LoadingSpinner({
  size = 'large',
  color = Colors.emerald[500],
  fullScreen = false,
  label,
}: Props) {
  if (fullScreen) {
    return (
      <View style={styles.fullScreen}>
        <ActivityIndicator size={size} color={color} />
        {label && (
          <Text variant="caption" color="muted" style={styles.label}>
            {label}
          </Text>
        )}
      </View>
    );
  }

  return (
    <View style={styles.inline}>
      <ActivityIndicator size={size} color={color} />
      {label && (
        <Text variant="caption" color="muted" style={styles.label}>
          {label}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background.primary,
    gap: 12,
  },
  inline: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  label: {
    marginTop: 8,
  },
});
