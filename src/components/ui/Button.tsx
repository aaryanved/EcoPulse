import React from 'react';
import {
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  type TouchableOpacityProps,
  View,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Text } from './Text';
import { Colors, BorderRadius, Spacing, FontSize, FontWeight } from '@/constants/theme';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface Props extends TouchableOpacityProps {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  children,
  disabled,
  onPressIn,
  onPressOut,
  style,
  ...props
}: Props) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = (e: Parameters<NonNullable<typeof onPressIn>>[0]) => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
    onPressIn?.(e);
  };

  const handlePressOut = (e: Parameters<NonNullable<typeof onPressOut>>[0]) => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    onPressOut?.(e);
  };

  const isDisabled = disabled || loading;

  return (
    <AnimatedTouchable
      style={[
        styles.base,
        styles[variant],
        styles[size],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        animatedStyle,
        style,
      ]}
      disabled={isDisabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.9}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled, busy: loading }}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? Colors.background.primary : Colors.emerald[500]}
          size={size === 'sm' ? 'small' : 'small'}
        />
      ) : (
        <View style={styles.content}>
          {leftIcon && <View style={styles.iconLeft} accessible={false}>{leftIcon}</View>}
          <Text
            style={[
              styles.label,
              textStyles[variant],
              textSizes[size],
              isDisabled && styles.disabledText,
            ]}
          >
            {children}
          </Text>
          {rightIcon && <View style={styles.iconRight} accessible={false}>{rightIcon}</View>}
        </View>
      )}
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  primary: {
    backgroundColor: Colors.emerald[500],
  },
  secondary: {
    backgroundColor: Colors.background.elevated,
  },
  outline: {
    backgroundColor: Colors.transparent,
    borderWidth: 1.5,
    borderColor: Colors.emerald[500],
  },
  ghost: {
    backgroundColor: Colors.transparent,
  },
  danger: {
    backgroundColor: Colors.error,
  },
  sm: {
    height: 36,
    paddingHorizontal: Spacing.md,
  },
  md: {
    height: 48,
    paddingHorizontal: Spacing.xl,
  },
  lg: {
    height: 56,
    paddingHorizontal: Spacing['2xl'],
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconLeft: {
    marginRight: Spacing.sm,
  },
  iconRight: {
    marginLeft: Spacing.sm,
  },
  label: {
    fontWeight: FontWeight.semibold,
  },
  disabledText: {},
});

const textStyles: Record<string, object> = {
  primary: { color: Colors.background.primary },
  secondary: { color: Colors.text.primary },
  outline: { color: Colors.emerald[500] },
  ghost: { color: Colors.emerald[500] },
  danger: { color: Colors.white },
};

const textSizes: Record<string, object> = {
  sm: { fontSize: FontSize.sm },
  md: { fontSize: FontSize.base },
  lg: { fontSize: FontSize.md },
};
