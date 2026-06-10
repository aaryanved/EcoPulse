import React from 'react';
import { View, StyleSheet, type ViewProps } from 'react-native';
import { Colors, BorderRadius, Spacing, Shadow } from '@/constants/theme';

type Variant = 'default' | 'elevated' | 'outlined' | 'glow';

interface Props extends ViewProps {
  variant?: Variant;
  padding?: keyof typeof Spacing | number;
}

export function Card({ variant = 'default', padding = 'base', children, style, ...props }: Props) {
  const paddingValue = typeof padding === 'number' ? padding : Spacing[padding];

  return (
    <View
      style={[
        styles.base,
        variantStyles[variant],
        { padding: paddingValue },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
});

const variantStyles: Record<Variant, object> = {
  default: {
    backgroundColor: Colors.background.card,
  },
  elevated: {
    backgroundColor: Colors.background.elevated,
    ...Shadow.md,
  },
  outlined: {
    backgroundColor: Colors.background.card,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  glow: {
    backgroundColor: Colors.background.card,
    borderWidth: 1,
    borderColor: `${Colors.emerald[500]}40`,
    ...Shadow.glow,
  },
};
