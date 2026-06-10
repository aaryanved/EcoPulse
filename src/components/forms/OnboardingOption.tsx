import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from '@/components/ui/Text';
import { Colors, BorderRadius, Spacing } from '@/constants/theme';

interface Props {
  icon: string;
  label: string;
  description?: string;
  selected: boolean;
  onSelect: () => void;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function OnboardingOption({ icon, label, description, selected, onSelect }: Props) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedTouchable
      style={[styles.option, selected && styles.selected, animatedStyle]}
      onPress={onSelect}
      onPressIn={() => { scale.value = withSpring(0.97); }}
      onPressOut={() => { scale.value = withSpring(1); }}
      activeOpacity={0.9}
    >
      <View style={[styles.iconWrapper, selected && styles.iconSelected]}>
        <MaterialCommunityIcons
          name={icon as any}
          size={26}
          color={selected ? Colors.background.primary : Colors.emerald[600]}
        />
      </View>
      <View style={styles.textWrapper}>
        <Text variant="body" weight="semibold" style={selected ? styles.labelSelected : undefined}>
          {label}
        </Text>
        {description && (
          <Text variant="caption" color="muted">
            {description}
          </Text>
        )}
      </View>
      {selected && (
        <MaterialCommunityIcons name="check-circle" size={22} color={Colors.emerald[500]} />
      )}
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    gap: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  selected: {
    borderColor: Colors.emerald[500],
    backgroundColor: `${Colors.emerald[500]}10`,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    backgroundColor: `${Colors.emerald[500]}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconSelected: {
    backgroundColor: Colors.emerald[500],
  },
  textWrapper: {
    flex: 1,
    gap: 2,
  },
  labelSelected: {
    color: Colors.emerald[400],
  },
});
