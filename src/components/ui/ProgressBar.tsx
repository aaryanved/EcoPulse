import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Colors, BorderRadius } from '@/constants/theme';

interface Props {
  progress: number;
  color?: string;
  backgroundColor?: string;
  height?: number;
  animated?: boolean;
}

export function ProgressBar({
  progress,
  color = Colors.emerald[500],
  backgroundColor = Colors.background.elevated,
  height = 8,
  animated = true,
}: Props) {
  const width = useSharedValue(0);
  const clampedProgress = Math.min(Math.max(progress, 0), 1);

  useEffect(() => {
    if (animated) {
      width.value = withSpring(clampedProgress * 100, { damping: 15, stiffness: 80 });
    } else {
      width.value = withTiming(clampedProgress * 100, { duration: 0 });
    }
  }, [clampedProgress, animated, width]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }));

  return (
    <View
      style={[styles.track, { backgroundColor, height, borderRadius: height / 2 }]}
      accessible
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clampedProgress * 100) }}
    >
      <Animated.View
        style={[
          styles.fill,
          { backgroundColor: color, height, borderRadius: height / 2 },
          animatedStyle,
        ]}
        accessible={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    minWidth: 4,
  },
});
