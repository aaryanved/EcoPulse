import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useCarbon } from '@/hooks/useCarbon';
import { formatCarbonKg, carbonToTrees, carbonToFlights, carbonToDrivingKm, getCarbonLevel } from '@/utils/carbon';
import { Colors, Spacing, BorderRadius, FontSize } from '@/constants/theme';

// ---------------------------------------------------------------------------
// Personalized savings calculator
// ---------------------------------------------------------------------------

interface SimOption {
  id: string;
  label: string;
  description: string;
  icon: string;
  category: 'transport' | 'food' | 'electricity' | 'purchases';
  enabled: boolean;
  savingsKg: number; // computed from user data
}

function computeSavings(
  id: string,
  breakdown: { transport: number; food: number; electricity: number; purchases: number; waste: number; other: number },
  transportMode: string,
  dietType: string,
  energySource: string
): number {
  switch (id) {
    case 'public_transit':
      // Already on transit? Minimal savings
      if (['public_transit', 'cycling', 'walking'].includes(transportMode)) return 0;
      // Remove commute share (~60%) of car transport
      return Math.round(breakdown.transport * 0.55);

    case 'vegetarian':
      if (['vegan', 'vegetarian'].includes(dietType)) return 0;
      // Meat-heavy diet: ~55% reduction; pescatarian: ~25%
      const meatFactor = dietType === 'omnivore' ? 0.5 : dietType === 'flexitarian' ? 0.3 : 0.1;
      return Math.round(breakdown.food * meatFactor);

    case 'no_flights':
      // Flights typically ~30–40% of transport for car users
      return Math.round(breakdown.transport * (transportMode === 'car' ? 0.3 : 0.2));

    case 'green_energy':
      if (['solar', 'renewable'].includes(energySource)) return 0;
      // Switching to renewables: ~80% electricity reduction
      return Math.round(breakdown.electricity * 0.8);

    case 'reduce_shopping':
      // Cut non-essential purchases by 50%
      return Math.round(breakdown.purchases * 0.5);

    case 'wfh':
      if (['public_transit', 'cycling', 'walking'].includes(transportMode)) return 0;
      // 3 fewer commute days out of 5 = ~40% transport reduction on commuting portion (~60%)
      return Math.round(breakdown.transport * 0.24);

    case 'vegan':
      if (dietType === 'vegan') return 0;
      const veganFactor = dietType === 'omnivore' ? 0.65 : dietType === 'flexitarian' ? 0.45 : dietType === 'vegetarian' ? 0.2 : 0.05;
      return Math.round(breakdown.food * veganFactor);

    case 'ev':
      if (['electric_vehicle', 'cycling', 'walking', 'public_transit'].includes(transportMode)) return 0;
      // EV vs ICE: ~75% reduction in transport carbon
      return Math.round(breakdown.transport * 0.65);

    default:
      return 0;
  }
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function SimulatorScreen() {
  const { profile } = useAuth();
  const { currentMonthBreakdown } = useCarbon();

  const transportMode = profile?.transport_mode ?? 'car';
  const dietType = profile?.diet_type ?? 'omnivore';
  const energySource = profile?.energy_source ?? 'grid';

  const bd = currentMonthBreakdown;
  const fallbackTotal = 200;
  const currentTotal = bd.total > 0 ? bd.total : fallbackTotal;
  const activeBd = bd.total > 0
    ? bd
    : { transport: 80, food: 60, electricity: 40, purchases: 20, waste: 0, other: 0 };

  const BASE_OPTIONS: Omit<SimOption, 'savingsKg'>[] = [
    { id: 'public_transit', label: 'Switch to Public Transit', description: 'Replace car commutes with bus/train', icon: 'bus', category: 'transport', enabled: false },
    { id: 'ev', label: 'Drive an Electric Vehicle', description: 'Switch from ICE to EV for all driving', icon: 'car-electric', category: 'transport', enabled: false },
    { id: 'wfh', label: 'Work From Home 3 Days', description: 'Cut weekly commute by 60%', icon: 'home-outline', category: 'transport', enabled: false },
    { id: 'no_flights', label: 'No Flights This Year', description: 'Avoid all air travel', icon: 'airplane-off', category: 'transport', enabled: false },
    { id: 'vegetarian', label: 'Vegetarian Diet', description: 'Remove meat, keep dairy & eggs', icon: 'leaf', category: 'food', enabled: false },
    { id: 'vegan', label: 'Vegan Diet', description: 'Remove all animal products', icon: 'sprout', category: 'food', enabled: false },
    { id: 'green_energy', label: 'Switch to Green Energy', description: 'Renewable electricity tariff', icon: 'solar-panel', category: 'electricity', enabled: false },
    { id: 'reduce_shopping', label: 'Buy Less New Stuff', description: 'Cut non-essential purchases by 50%', icon: 'cart-off', category: 'purchases', enabled: false },
  ];

  const [changes, setChanges] = useState<SimOption[]>(() =>
    BASE_OPTIONS.map(opt => ({
      ...opt,
      savingsKg: computeSavings(opt.id, activeBd, transportMode, dietType, energySource),
    }))
  );

  const [projectionYears, setProjectionYears] = useState(5);

  const enabledChanges = changes.filter(c => c.enabled && c.savingsKg > 0);
  const totalSavingsPerMonth = enabledChanges.reduce((s, c) => s + c.savingsKg, 0);
  const projectedTotal = Math.max(0, currentTotal - totalSavingsPerMonth);
  const reductionPct = currentTotal > 0 ? ((totalSavingsPerMonth / currentTotal) * 100) : 0;

  const months = projectionYears * 12;
  const futureCurrentKg = currentTotal * months;
  const futureProjectedKg = projectedTotal * months;
  const futureSavingsKg = futureCurrentKg - futureProjectedKg;

  function toggleChange(id: string) {
    setChanges(prev => prev.map(c => (c.id === id ? { ...c, enabled: !c.enabled } : c)));
  }

  function askAIAboutScenario() {
    const scenarioText = enabledChanges.length > 0
      ? `I'm considering these lifestyle changes in the Carbon Simulator: ${enabledChanges.map(c => c.label).join(', ')}. This would save ~${formatCarbonKg(totalSavingsPerMonth)}/month (${reductionPct.toFixed(0)}% reduction). Should I prioritize differently? What's the biggest real-world impact I should focus on first?`
      : "I just opened the Carbon Simulator. Based on my current carbon data, what's the single lifestyle change that would have the biggest impact for me?";

    router.push({
      pathname: '/(tabs)/coach',
      params: { prefill: encodeURIComponent(scenarioText) },
    });
  }

  const levelColorMap = { low: Colors.carbon.low, medium: Colors.carbon.medium, high: Colors.carbon.high, critical: Colors.carbon.critical };
  const currentLevelColor = levelColorMap[getCarbonLevel(currentTotal)];
  const projectedLevelColor = levelColorMap[getCarbonLevel(projectedTotal)];

  const reductionBarWidth = useSharedValue(0);
  reductionBarWidth.value = withSpring(Math.min(reductionPct, 100), { damping: 14 });
  const reductionBarStyle = useAnimatedStyle(() => ({
    width: `${reductionBarWidth.value}%`,
  }));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="close" size={22} color={Colors.text.secondary} />
        </TouchableOpacity>
        <Text variant="title">Carbon Simulator</Text>
        <TouchableOpacity onPress={askAIAboutScenario} style={styles.aiButton}>
          <MaterialCommunityIcons name="robot" size={18} color={Colors.emerald[500]} />
          <Text variant="caption" color="secondary" style={{ fontWeight: '600' }}>Ask AI</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Carbon Twin */}
        <Card variant="glow">
          <Text variant="label" color="muted">Carbon Twin</Text>
          <View style={styles.twinRow}>
            <View style={styles.twin}>
              <MaterialCommunityIcons name="earth" size={52} color={currentLevelColor} />
              <Text variant="caption" color="muted">Current Path</Text>
              <Text style={[styles.twinValue, { color: currentLevelColor }]}>
                {formatCarbonKg(currentTotal)}
              </Text>
              <Text variant="caption" color="muted">/month</Text>
            </View>

            <View style={styles.twinArrow}>
              <MaterialCommunityIcons name="arrow-right" size={24} color={Colors.text.dim} />
              {reductionPct > 0 && (
                <Text style={[styles.reductionBadge, { color: Colors.carbon.low }]}>
                  -{reductionPct.toFixed(0)}%
                </Text>
              )}
            </View>

            <View style={styles.twin}>
              <MaterialCommunityIcons name="earth" size={52} color={projectedLevelColor} />
              <Text variant="caption" color="muted">With Changes</Text>
              <Text style={[styles.twinValue, { color: projectedLevelColor }]}>
                {formatCarbonKg(projectedTotal)}
              </Text>
              <Text variant="caption" color="muted">/month</Text>
            </View>
          </View>

          {/* Reduction bar */}
          <View style={styles.reductionBarTrack}>
            <Animated.View style={[styles.reductionBarFill, reductionBarStyle]} />
          </View>

          {totalSavingsPerMonth > 0 && (
            <View style={styles.savingsSummary}>
              <MaterialCommunityIcons name="trending-down" size={18} color={Colors.carbon.low} />
              <Text style={styles.savingsText}>
                Saving {formatCarbonKg(totalSavingsPerMonth)}/month · {reductionPct.toFixed(0)}% reduction
              </Text>
            </View>
          )}
        </Card>

        {/* What-if toggles */}
        <View style={styles.section}>
          <Text variant="title">What if you...</Text>
          {changes.map(change => {
            const isAlreadyDone = change.savingsKg === 0;
            return (
              <View
                key={change.id}
                style={[styles.changeRow, change.enabled && styles.changeRowActive, isAlreadyDone && styles.changeRowDim]}
              >
                <View style={[styles.changeIcon, { backgroundColor: `${Colors.emerald[500]}15` }]}>
                  <MaterialCommunityIcons
                    name={change.icon as any}
                    size={20}
                    color={isAlreadyDone ? Colors.text.dim : Colors.emerald[500]}
                  />
                </View>
                <View style={styles.changeInfo}>
                  <Text variant="body" weight="medium" style={isAlreadyDone ? { color: Colors.text.dim } : undefined}>
                    {change.label}
                  </Text>
                  <Text variant="caption" color="muted">{change.description}</Text>
                  {isAlreadyDone ? (
                    <Text variant="caption" style={{ color: Colors.emerald[600] }}>
                      Already on your path ✓
                    </Text>
                  ) : (
                    <Text variant="caption" style={{ color: Colors.carbon.low }}>
                      Saves ~{formatCarbonKg(change.savingsKg)}/month
                    </Text>
                  )}
                </View>
                <Switch
                  value={change.enabled}
                  onValueChange={() => { if (!isAlreadyDone) toggleChange(change.id); }}
                  disabled={isAlreadyDone}
                  trackColor={{
                    false: Colors.background.elevated,
                    true: `${Colors.emerald[500]}60`,
                  }}
                  thumbColor={change.enabled ? Colors.emerald[500] : Colors.text.dim}
                />
              </View>
            );
          })}
        </View>

        {/* Time Machine */}
        {totalSavingsPerMonth > 0 && (
          <Card variant="elevated">
            <View style={styles.timeMachineHeader}>
              <Text variant="label" color="muted">Carbon Time Machine</Text>
              <View style={styles.yearPicker}>
                {[1, 5, 10].map(y => (
                  <TouchableOpacity
                    key={y}
                    onPress={() => setProjectionYears(y)}
                    style={[styles.yearBtn, projectionYears === y && styles.yearBtnActive]}
                  >
                    <Text
                      variant="caption"
                      weight="semibold"
                      style={{ color: projectionYears === y ? Colors.background.primary : Colors.text.muted }}
                    >
                      {y}yr
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.timeMachine}>
              <View style={styles.timeBlock}>
                <Text variant="caption" color="muted">Current path</Text>
                <Text style={[styles.timeValue, { color: currentLevelColor }]}>
                  {formatCarbonKg(futureCurrentKg)}
                </Text>
              </View>
              <View style={styles.timeSavings}>
                <MaterialCommunityIcons name="minus" size={16} color={Colors.text.dim} />
                <Text style={styles.futureSavingsText}>{formatCarbonKg(futureSavingsKg)} saved</Text>
                <MaterialCommunityIcons name="minus" size={16} color={Colors.text.dim} />
              </View>
              <View style={styles.timeBlock}>
                <Text variant="caption" color="muted">With changes</Text>
                <Text style={[styles.timeValue, { color: Colors.carbon.low }]}>
                  {formatCarbonKg(futureProjectedKg)}
                </Text>
              </View>
            </View>

            <View style={styles.equivalents}>
              <View style={styles.equiv}>
                <MaterialCommunityIcons name="tree" size={18} color={Colors.carbon.low} />
                <Text variant="caption" color="muted">{carbonToTrees(futureSavingsKg)} trees offset</Text>
              </View>
              <View style={styles.equiv}>
                <MaterialCommunityIcons name="airplane" size={18} color={Colors.info} />
                <Text variant="caption" color="muted">{carbonToFlights(futureSavingsKg)} fewer flights</Text>
              </View>
              <View style={styles.equiv}>
                <MaterialCommunityIcons name="car" size={18} color={Colors.warning} />
                <Text variant="caption" color="muted">{carbonToDrivingKm(futureSavingsKg).toLocaleString()} km not driven</Text>
              </View>
            </View>
          </Card>
        )}

        {/* Ask AI CTA */}
        <Button
          onPress={askAIAboutScenario}
          variant={totalSavingsPerMonth > 0 ? 'primary' : 'outline'}
          fullWidth
        >
          {totalSavingsPerMonth > 0
            ? `Ask AI: Is this the best strategy for me?`
            : 'Ask AI: What should I change first?'}
        </Button>

      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: `${Colors.emerald[500]}15`,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: `${Colors.emerald[700]}60`,
  },
  scrollContent: { padding: Spacing['2xl'], gap: Spacing.xl, paddingBottom: Spacing['4xl'] },
  twinRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingVertical: Spacing.base },
  twin: { alignItems: 'center', gap: Spacing.xs },
  twinArrow: { alignItems: 'center', gap: 4 },
  twinValue: { fontSize: FontSize['2xl'], fontWeight: '800' },
  reductionBadge: { fontSize: FontSize.sm, fontWeight: '700' },
  reductionBarTrack: {
    height: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background.elevated,
    overflow: 'hidden',
    marginTop: Spacing.sm,
  },
  reductionBarFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.carbon.low,
  },
  savingsSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: `${Colors.carbon.low}15`,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginTop: Spacing.sm,
  },
  savingsText: { color: Colors.carbon.low, fontSize: FontSize.sm, fontWeight: '600' },
  section: { gap: Spacing.md },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  changeRowActive: { borderColor: Colors.emerald[700], backgroundColor: `${Colors.emerald[500]}08` },
  changeRowDim: { opacity: 0.5 },
  changeIcon: { width: 40, height: 40, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  changeInfo: { flex: 1, gap: 2 },
  timeMachineHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.base },
  yearPicker: { flexDirection: 'row', gap: Spacing.xs },
  yearBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  yearBtnActive: { backgroundColor: Colors.emerald[500], borderColor: Colors.emerald[500] },
  timeMachine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  timeBlock: { alignItems: 'center', gap: Spacing.xs },
  timeSavings: { alignItems: 'center', gap: 2 },
  futureSavingsText: { color: Colors.carbon.low, fontSize: FontSize.xs, fontWeight: '600' },
  timeValue: { fontSize: FontSize.xl, fontWeight: '800' },
  equivalents: { gap: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.divider, marginTop: Spacing.base, paddingTop: Spacing.base },
  equiv: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
});
