import React from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from '@/components/ui/Text';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useGridIntensity } from '@/hooks/useGridIntensity';
import { getGridIntensityLevel } from '@/utils/carbon';
import { Colors, Spacing, BorderRadius, FontSize } from '@/constants/theme';

function prettifyZone(zone: string): string {
  return zone.replace(/-/g, ' · ');
}

interface GridIntensityCardProps {
  zone?: string;
}

export function GridIntensityCard({ zone = 'US-CA' }: GridIntensityCardProps) {
  const { intensityGCo2PerKwh, renewablePercent, isLoading, error, refresh } = useGridIntensity(zone);

  // Silent fail — don't clutter the UI if the key is missing or API is down
  if (error) return null;

  const level = getGridIntensityLevel(intensityGCo2PerKwh);
  const renewableFraction = Math.min(renewablePercent / 100, 1);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <MaterialCommunityIcons name="transmission-tower" size={14} color={Colors.text.muted} />
          <Text variant="label" color="muted">Live Grid · {prettifyZone(zone)}</Text>
        </View>
        <TouchableOpacity
          onPress={refresh}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          disabled={isLoading}
          accessibilityRole="button"
          accessibilityLabel="Refresh grid intensity"
          accessibilityState={{ disabled: isLoading, busy: isLoading }}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={Colors.text.muted} accessible={false} />
          ) : (
            <MaterialCommunityIcons name="refresh" size={16} color={Colors.text.muted} accessible={false} />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.intensityRow}>
        <View style={[styles.levelDot, { backgroundColor: level.color }]} />
        <Text style={[styles.intensityValue, { color: level.color }]}>
          {intensityGCo2PerKwh.toFixed(0)}
        </Text>
        <Text variant="caption" color="muted" style={styles.intensityUnit}>
          g CO₂/kWh
        </Text>
        <View style={[styles.levelBadge, { backgroundColor: `${level.color}20`, borderColor: `${level.color}40` }]}>
          <Text variant="caption" style={{ color: level.color, fontWeight: '600' }}>
            {level.label}
          </Text>
        </View>
      </View>

      {renewablePercent > 0 && (
        <View style={styles.renewableSection}>
          <View style={styles.renewableHeader}>
            <Text variant="caption" color="muted">Renewables</Text>
            <Text variant="caption" color="muted">{renewablePercent.toFixed(0)}%</Text>
          </View>
          <ProgressBar progress={renewableFraction} color={Colors.emerald[500]} height={4} />
        </View>
      )}

      <View style={styles.adviceRow}>
        <MaterialCommunityIcons name={level.icon as any} size={13} color={level.color} />
        <Text variant="caption" color="muted" style={styles.adviceText}>
          {level.advice}
        </Text>
      </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  intensityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  levelDot: {
    width: 8,
    height: 8,
    borderRadius: BorderRadius.full,
  },
  intensityValue: {
    fontSize: FontSize['2xl'],
    fontWeight: '800',
    lineHeight: 32,
  },
  intensityUnit: {
    flex: 1,
  },
  levelBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  renewableSection: {
    gap: 4,
  },
  renewableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  adviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  adviceText: {
    flex: 1,
  },
});
