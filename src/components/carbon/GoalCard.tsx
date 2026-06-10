import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from '@/components/ui/Text';
import { ProgressBar } from '@/components/ui/ProgressBar';
import type { GoalRow } from '@/types';
import { formatCarbonKg, getCategoryColor } from '@/utils/carbon';
import { formatDate } from '@/utils/date';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';

interface Props {
  goal: GoalRow;
}

export function GoalCard({ goal }: Props) {
  const progress = Math.min(goal.current_carbon_kg / goal.target_carbon_kg, 1);
  const color =
    goal.category === 'overall'
      ? Colors.emerald[500]
      : getCategoryColor(goal.category as any);
  const remaining = Math.max(0, goal.target_carbon_kg - goal.current_carbon_kg);
  const isCompleted = goal.status === 'completed';

  return (
    <View style={[styles.card, isCompleted && styles.completed]}>
      <View style={styles.header}>
        <View style={[styles.iconWrapper, { backgroundColor: `${color}15` }]}>
          <MaterialCommunityIcons
            name={isCompleted ? 'check-circle' : 'target'}
            size={18}
            color={isCompleted ? Colors.carbon.low : color}
          />
        </View>
        <View style={styles.info}>
          <Text variant="body" weight="semibold" numberOfLines={1}>
            {goal.title}
          </Text>
          <Text variant="caption" color="muted">
            {goal.period} · ends {formatDate(goal.end_date, 'short')}
          </Text>
        </View>
        <View style={styles.numbers}>
          <Text variant="caption" weight="semibold" style={{ color }}>
            {formatCarbonKg(goal.current_carbon_kg)}
          </Text>
          <Text variant="caption" color="dim">
            / {formatCarbonKg(goal.target_carbon_kg)}
          </Text>
        </View>
      </View>

      <ProgressBar progress={progress} color={isCompleted ? Colors.carbon.low : color} height={4} />

      {!isCompleted && remaining > 0 && (
        <Text variant="caption" color="muted">
          {formatCarbonKg(remaining)} remaining
        </Text>
      )}
      {isCompleted && (
        <Text variant="caption" style={{ color: Colors.carbon.low }}>
          Goal achieved!
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  completed: {
    borderColor: `${Colors.carbon.low}40`,
    backgroundColor: `${Colors.carbon.low}05`,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconWrapper: {
    width: 34,
    height: 34,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1, gap: 2 },
  numbers: { alignItems: 'flex-end', gap: 1 },
});
