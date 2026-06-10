import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from '@/components/ui/Text';
import type { ActivityRow } from '@/types';
import { getCategoryColor, getCategoryIcon, formatCarbonKg } from '@/utils/carbon';
import { formatRelativeTime } from '@/utils/date';
import { Colors, Spacing, BorderRadius, FontSize } from '@/constants/theme';

interface Props {
  activity: ActivityRow;
  onDelete?: (id: string) => void;
}

export function ActivityCard({ activity, onDelete }: Props) {
  const color = getCategoryColor(activity.category);
  const icon = getCategoryIcon(activity.category);

  return (
    <View style={styles.container}>
      <View style={[styles.iconWrapper, { backgroundColor: `${color}15` }]}>
        <MaterialCommunityIcons name={icon as any} size={22} color={color} />
      </View>
      <View style={styles.content}>
        <Text variant="body" weight="medium" numberOfLines={1}>
          {activity.description}
        </Text>
        <Text variant="caption" color="muted">
          {activity.subcategory} · {formatRelativeTime(activity.activity_date)}
        </Text>
      </View>
      <View style={styles.right}>
        <Text style={[styles.carbon, { color }]}>
          {formatCarbonKg(activity.carbon_kg)}
        </Text>
        <Text variant="caption" color="dim">
          CO₂e
        </Text>
      </View>
      {onDelete && (
        <TouchableOpacity
          onPress={() => onDelete(activity.id)}
          style={styles.deleteButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialCommunityIcons name="close" size={16} color={Colors.text.dim} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
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
    gap: 2,
  },
  right: {
    alignItems: 'flex-end',
    gap: 2,
  },
  carbon: {
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  deleteButton: {
    padding: Spacing.xs,
    marginLeft: -Spacing.xs,
  },
});
