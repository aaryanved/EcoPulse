import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from './Text';
import { Colors, BorderRadius, Spacing, FontSize } from '@/constants/theme';

type Variant = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'emerald';

interface Props {
  label: string;
  variant?: Variant;
  size?: 'sm' | 'md';
}

const variantConfig: Record<Variant, { bg: string; text: string; border: string }> = {
  success: { bg: `${Colors.success}20`, text: Colors.success, border: `${Colors.success}40` },
  warning: { bg: `${Colors.warning}20`, text: Colors.warning, border: `${Colors.warning}40` },
  error: { bg: `${Colors.error}20`, text: Colors.error, border: `${Colors.error}40` },
  info: { bg: `${Colors.info}20`, text: Colors.info, border: `${Colors.info}40` },
  neutral: { bg: Colors.background.elevated, text: Colors.text.secondary, border: Colors.border },
  emerald: { bg: `${Colors.emerald[500]}20`, text: Colors.emerald[400], border: `${Colors.emerald[500]}40` },
};

export function Badge({ label, variant = 'neutral', size = 'sm' }: Props) {
  const config = variantConfig[variant];
  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: config.bg,
          borderColor: config.border,
          paddingHorizontal: isSmall ? Spacing.sm : Spacing.md,
          paddingVertical: isSmall ? 2 : Spacing.xs,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: config.text, fontSize: isSmall ? FontSize.xs : FontSize.sm },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
});
