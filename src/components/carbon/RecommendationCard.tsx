import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from '@/components/ui/Text';
import type { AIRecommendationRow } from '@/types';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';

interface Props {
  recommendation: AIRecommendationRow;
  onDismiss: (id: string) => void;
  onRead: (id: string) => void;
}

const TYPE_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
  weekly_report: { icon: 'chart-line', color: Colors.emerald[500], label: 'Weekly Report' },
  tip: { icon: 'lightbulb-outline', color: Colors.warning, label: 'Tip' },
  challenge: { icon: 'trophy-outline', color: Colors.info, label: 'Challenge' },
  goal: { icon: 'target', color: '#a855f7', label: 'Goal' },
  alert: { icon: 'alert-circle-outline', color: Colors.error, label: 'Alert' },
};

export function RecommendationCard({ recommendation, onDismiss, onRead }: Props) {
  const config = TYPE_CONFIG[recommendation.type] ?? TYPE_CONFIG.tip;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onRead(recommendation.id)}
      activeOpacity={0.9}
    >
      <View style={[styles.iconWrapper, { backgroundColor: `${config.color}15` }]}>
        <MaterialCommunityIcons name={config.icon as any} size={20} color={config.color} />
      </View>
      <View style={styles.content}>
        <Text variant="label" style={{ color: config.color }}>
          {config.label}
        </Text>
        <Text variant="body" weight="semibold" numberOfLines={1}>
          {recommendation.title}
        </Text>
        <Text variant="caption" color="muted" numberOfLines={2}>
          {recommendation.content}
        </Text>
        {recommendation.potential_savings_kg > 0 && (
          <View style={styles.savingsRow}>
            <MaterialCommunityIcons name="leaf" size={12} color={Colors.carbon.low} />
            <Text variant="caption" style={{ color: Colors.carbon.low }}>
              Save ~{recommendation.potential_savings_kg.toFixed(1)} kg CO₂/mo
            </Text>
          </View>
        )}
      </View>
      <TouchableOpacity
        onPress={() => onDismiss(recommendation.id)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <MaterialCommunityIcons name="close" size={16} color={Colors.text.dim} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: 3,
  },
  savingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
});
