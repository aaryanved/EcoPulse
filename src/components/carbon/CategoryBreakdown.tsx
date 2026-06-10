import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@/components/ui/Text';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Card } from '@/components/ui/Card';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { CarbonBreakdown, ActivityCategory } from '@/types';
import { getCategoryColor, getCategoryIcon, getCategoryLabel, formatCarbonKg } from '@/utils/carbon';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';

interface Props {
  breakdown: CarbonBreakdown;
}

const CATEGORIES: ActivityCategory[] = ['transport', 'food', 'electricity', 'purchases', 'waste', 'other'];

export function CategoryBreakdown({ breakdown }: Props) {
  const total = breakdown.total || 1;

  const categories = CATEGORIES
    .map(cat => ({
      category: cat,
      value: breakdown[cat] ?? 0,
      percentage: ((breakdown[cat] ?? 0) / total) * 100,
      color: getCategoryColor(cat),
      icon: getCategoryIcon(cat),
      label: getCategoryLabel(cat),
    }))
    .filter(c => c.value > 0)
    .sort((a, b) => b.value - a.value);

  if (categories.length === 0) {
    return (
      <Card>
        <Text variant="body" color="muted" style={{ textAlign: 'center', padding: Spacing.base }}>
          No activities logged this month
        </Text>
      </Card>
    );
  }

  return (
    <Card>
      <Text variant="title" style={styles.title}>
        Breakdown
      </Text>
      <View style={styles.list}>
        {categories.map(item => (
          <View key={item.category} style={styles.row}>
            <View style={[styles.iconWrapper, { backgroundColor: `${item.color}20` }]}>
              <MaterialCommunityIcons name={item.icon as any} size={18} color={item.color} />
            </View>
            <View style={styles.info}>
              <View style={styles.labelRow}>
                <Text variant="body" weight="medium">
                  {item.label}
                </Text>
                <Text variant="body" weight="semibold" style={{ color: item.color }}>
                  {formatCarbonKg(item.value)}
                </Text>
              </View>
              <View style={styles.progressRow}>
                <ProgressBar
                  progress={item.percentage / 100}
                  color={item.color}
                  height={4}
                />
                <Text variant="caption" color="muted" style={styles.percent}>
                  {item.percentage.toFixed(0)}%
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  title: {
    marginBottom: Spacing.base,
  },
  list: {
    gap: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 4,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  percent: {
    minWidth: 32,
    textAlign: 'right',
    fontSize: FontSize.xs,
  },
});
