import React from 'react';
import { Text as RNText, type TextProps, StyleSheet } from 'react-native';
import { Colors, FontSize, FontWeight } from '@/constants/theme';

type Variant = 'display' | 'heading' | 'title' | 'body' | 'caption' | 'label';
type Weight = keyof typeof FontWeight;
type Color = 'primary' | 'secondary' | 'muted' | 'dim' | 'success' | 'warning' | 'error' | 'inverse';

interface Props extends TextProps {
  variant?: Variant;
  weight?: Weight;
  color?: Color;
  size?: keyof typeof FontSize;
}

const variantStyles: Record<Variant, object> = {
  display: { fontSize: FontSize['4xl'], fontWeight: FontWeight.extrabold, lineHeight: 48 },
  heading: { fontSize: FontSize['3xl'], fontWeight: FontWeight.bold, lineHeight: 38 },
  title: { fontSize: FontSize.xl, fontWeight: FontWeight.semibold, lineHeight: 28 },
  body: { fontSize: FontSize.base, fontWeight: FontWeight.regular, lineHeight: 22 },
  caption: { fontSize: FontSize.sm, fontWeight: FontWeight.regular, lineHeight: 18 },
  label: { fontSize: FontSize.xs, fontWeight: FontWeight.medium, lineHeight: 16, letterSpacing: 0.5, textTransform: 'uppercase' },
};

const colorMap: Record<Color, string> = {
  primary: Colors.text.primary,
  secondary: Colors.text.secondary,
  muted: Colors.text.muted,
  dim: Colors.text.dim,
  success: Colors.success,
  warning: Colors.warning,
  error: Colors.error,
  inverse: Colors.text.inverse,
};

export function Text({ variant = 'body', weight, color = 'primary', size, style, ...props }: Props) {
  return (
    <RNText
      style={[
        styles.base,
        variantStyles[variant],
        weight && { fontWeight: FontWeight[weight] },
        size && { fontSize: FontSize[size] },
        { color: colorMap[color] },
        style,
      ]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    color: Colors.text.primary,
  },
});
