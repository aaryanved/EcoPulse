import React, { useState } from 'react';
import {
  TextInput,
  View,
  StyleSheet,
  type TextInputProps,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from './Text';
import { Colors, BorderRadius, Spacing, FontSize } from '@/constants/theme';

interface Props extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
  secureToggle?: boolean;
}

export function Input({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  onRightIconPress,
  secureToggle = false,
  secureTextEntry,
  style,
  ...props
}: Props) {
  const [isSecure, setIsSecure] = useState(secureTextEntry ?? false);
  const [isFocused, setIsFocused] = useState(false);

  const iconName = secureToggle ? (isSecure ? 'eye-off' : 'eye') : rightIcon;

  return (
    <View style={styles.container}>
      {label && (
        <Text variant="label" color="secondary" style={styles.label}>
          {label}
        </Text>
      )}
      <View
        style={[
          styles.inputWrapper,
          isFocused && styles.focused,
          error ? styles.errorBorder : null,
        ]}
      >
        {leftIcon && (
          <MaterialCommunityIcons
            name={leftIcon as any}
            size={20}
            color={isFocused ? Colors.emerald[500] : Colors.text.dim}
            style={styles.leftIcon}
            accessible={false}
          />
        )}
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={Colors.text.dim}
          selectionColor={Colors.emerald[500]}
          cursorColor={Colors.emerald[500]}
          secureTextEntry={isSecure}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          accessibilityLabel={label}
          {...props}
        />
        {(iconName || secureToggle) && (
          <TouchableOpacity
            onPress={secureToggle ? () => setIsSecure(s => !s) : onRightIconPress}
            style={styles.rightIcon}
            accessibilityRole="button"
            accessibilityLabel={secureToggle ? (isSecure ? 'Show password' : 'Hide password') : undefined}
          >
            <MaterialCommunityIcons
              name={iconName as any}
              size={20}
              color={Colors.text.dim}
              accessible={false}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <Text variant="caption" color="error" style={styles.errorText}>
          {error}
        </Text>
      )}
      {hint && !error && (
        <Text variant="caption" color="muted" style={styles.hint}>
          {hint}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.base,
  },
  label: {
    marginBottom: Spacing.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.elevated,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    minHeight: 52,
  },
  focused: {
    borderColor: Colors.emerald[500],
  },
  errorBorder: {
    borderColor: Colors.error,
  },
  leftIcon: {
    marginLeft: Spacing.md,
  },
  rightIcon: {
    padding: Spacing.md,
  },
  input: {
    flex: 1,
    color: Colors.text.primary,
    fontSize: FontSize.base,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  errorText: {
    marginTop: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  hint: {
    marginTop: Spacing.xs,
    marginLeft: Spacing.xs,
  },
});
