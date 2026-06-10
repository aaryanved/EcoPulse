import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Text } from '@/components/ui/Text';
import { Colors, Spacing, FontSize } from '@/constants/theme';
import type { CarbonTrend } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - Spacing['2xl'] * 2 - Spacing['2xl'];
const CHART_HEIGHT = 120;
const PADDING = { top: 10, bottom: 10, left: 4, right: 4 };

interface Props {
  data: CarbonTrend[];
  color?: string;
  label?: string;
}

export function CarbonTrendChart({ data, color = Colors.emerald[500], label }: Props) {
  if (!data || data.length < 2) {
    return (
      <View style={styles.empty}>
        <Text variant="caption" color="muted">
          Not enough data to show trend
        </Text>
      </View>
    );
  }

  const values = data.map(d => d.value);
  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);
  const range = maxValue - minValue || 1;

  const innerWidth = CHART_WIDTH - PADDING.left - PADDING.right;
  const innerHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;

  const points = data.map((d, i) => ({
    x: PADDING.left + (i / (data.length - 1)) * innerWidth,
    y: PADDING.top + innerHeight - ((d.value - minValue) / range) * innerHeight,
    value: d.value,
    date: d.date,
  }));

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');

  const areaPath =
    `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${CHART_HEIGHT - PADDING.bottom} ` +
    `L ${PADDING.left} ${CHART_HEIGHT - PADDING.bottom} Z`;

  const labelIndices = [0, Math.floor(data.length / 2), data.length - 1];

  return (
    <View style={styles.container}>
      {label && (
        <Text variant="label" color="muted" style={styles.label}>
          {label}
        </Text>
      )}
      <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
        <Defs>
          <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <Stop offset="100%" stopColor={color} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Path d={areaPath} fill="url(#grad)" />
        <Path d={linePath} stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r="3" fill={color} />
        ))}
      </Svg>
      <View style={styles.xLabels}>
        {labelIndices.map(i => (
          <Text key={i} variant="caption" color="dim" style={styles.xLabel}>
            {data[i]?.date?.slice(5) ?? ''}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.xs,
  },
  empty: {
    height: CHART_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    marginBottom: Spacing.xs,
  },
  xLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  xLabel: {
    fontSize: FontSize.xs,
  },
});
