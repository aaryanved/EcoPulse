import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolateColor,
} from 'react-native-reanimated';
import { Text } from '@/components/ui/Text';
import { Colors, Spacing, FontSize, FontWeight } from '@/constants/theme';
import { formatCarbonKg, getCarbonLevel, getVsGlobalAverage } from '@/utils/carbon';

interface Props {
  currentKg: number;
  goalKg: number;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_CONFIG = {
  sm: { radius: 50, strokeWidth: 6, fontSize: FontSize.lg },
  md: { radius: 70, strokeWidth: 8, fontSize: FontSize.xl },
  lg: { radius: 90, strokeWidth: 10, fontSize: FontSize['2xl'] },
};

export function CarbonMeter({ currentKg, goalKg, size = 'md' }: Props) {
  const config = SIZE_CONFIG[size];
  const progress = Math.min(currentKg / goalKg, 1.2);
  const level = getCarbonLevel(currentKg);
  const vsAverage = getVsGlobalAverage(currentKg);

  const levelColors: Record<string, string> = {
    low: Colors.carbon.low,
    medium: Colors.carbon.medium,
    high: Colors.carbon.high,
    critical: Colors.carbon.critical,
  };

  const color = levelColors[level];
  const diameter = config.radius * 2;
  const circumference = 2 * Math.PI * (config.radius - config.strokeWidth);

  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withSpring(progress, { damping: 15, stiffness: 60 });
  }, [progress, animatedProgress]);

  return (
    <View style={styles.container}>
      <View style={[styles.meterWrapper, { width: diameter, height: diameter }]}>
        <View style={[styles.trackCircle, { borderRadius: config.radius, borderWidth: config.strokeWidth, borderColor: `${color}20` }]} />
        <View style={styles.centerContent}>
          <Text style={[styles.value, { fontSize: config.fontSize, color }]}>
            {formatCarbonKg(currentKg)}
          </Text>
          <Text variant="caption" color="muted">
            of {formatCarbonKg(goalKg)} goal
          </Text>
        </View>
      </View>

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text variant="caption" color="muted">vs. Last Month</Text>
          <Text style={[styles.statValue, { color: vsAverage < 0 ? Colors.carbon.low : Colors.carbon.high }]}>
            {vsAverage > 0 ? '+' : ''}{vsAverage}%
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <Text variant="caption" color="muted">Status</Text>
          <Text style={[styles.statValue, { color }]}>
            {level.charAt(0).toUpperCase() + level.slice(1)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: Spacing.base,
  },
  meterWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  trackCircle: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  centerContent: {
    alignItems: 'center',
    gap: 2,
  },
  value: {
    fontWeight: FontWeight.bold,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  stat: {
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.divider,
  },
});
