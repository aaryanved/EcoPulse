import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useCarbon } from '@/hooks/useCarbon';
import { formatCarbonKg, carbonToTrees, carbonToFlights } from '@/utils/carbon';
import { Colors, Spacing, BorderRadius, FontSize } from '@/constants/theme';

interface SimulatorChange {
  id: string;
  label: string;
  description: string;
  icon: string;
  savingsPerMonth: number;
  category: string;
  enabled: boolean;
}

const SIMULATOR_OPTIONS: SimulatorChange[] = [
  {
    id: 'public_transit',
    label: 'Switch to Public Transit',
    description: 'Replace car commutes with bus/train',
    icon: 'bus',
    savingsPerMonth: 65,
    category: 'transport',
    enabled: false,
  },
  {
    id: 'vegetarian',
    label: 'Vegetarian Diet',
    description: 'Remove meat from your diet',
    icon: 'leaf',
    savingsPerMonth: 55,
    category: 'food',
    enabled: false,
  },
  {
    id: 'no_flights',
    label: 'No Flights This Year',
    description: 'Avoid air travel completely',
    icon: 'airplane-off',
    savingsPerMonth: 74,
    category: 'transport',
    enabled: false,
  },
  {
    id: 'green_energy',
    label: 'Switch to Green Energy',
    description: 'Change to a renewable energy tariff',
    icon: 'solar-panel',
    savingsPerMonth: 40,
    category: 'electricity',
    enabled: false,
  },
  {
    id: 'reduce_shopping',
    label: 'Buy Less New Stuff',
    description: 'Cut non-essential purchases by 50%',
    icon: 'cart-off',
    savingsPerMonth: 22,
    category: 'purchases',
    enabled: false,
  },
  {
    id: 'wfh',
    label: 'Work From Home',
    description: 'Reduce commuting days by 3/week',
    icon: 'home-outline',
    savingsPerMonth: 30,
    category: 'transport',
    enabled: false,
  },
];

export default function SimulatorScreen() {
  const { currentMonthBreakdown } = useCarbon();
  const [changes, setChanges] = useState(SIMULATOR_OPTIONS);

  const currentTotal = currentMonthBreakdown.total || 200;

  const totalSavings = changes
    .filter(c => c.enabled)
    .reduce((sum, c) => sum + c.savingsPerMonth, 0);

  const projectedTotal = Math.max(0, currentTotal - totalSavings);
  const reductionPercent = ((totalSavings / currentTotal) * 100).toFixed(0);

  const fiveYearCurrent = currentTotal * 60;
  const fiveYearProjected = projectedTotal * 60;
  const fiveYearSavings = fiveYearCurrent - fiveYearProjected;

  function toggleChange(id: string) {
    setChanges(prev =>
      prev.map(c => (c.id === id ? { ...c, enabled: !c.enabled } : c))
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <MaterialCommunityIcons name="close" size={22} color={Colors.text.secondary} />
        </TouchableOpacity>
        <Text variant="title">Carbon Simulator</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Twin Comparison */}
        <Card variant="glow">
          <Text variant="label" color="muted" style={styles.twinLabel}>
            Carbon Twin
          </Text>
          <View style={styles.twinRow}>
            <View style={styles.twin}>
              <MaterialCommunityIcons name="earth" size={48} color={Colors.carbon.high} />
              <Text variant="caption" color="muted">
                Current
              </Text>
              <Text style={[styles.twinValue, { color: Colors.carbon.high }]}>
                {formatCarbonKg(currentTotal)}
              </Text>
              <Text variant="caption" color="muted">
                per month
              </Text>
            </View>

            <MaterialCommunityIcons name="arrow-right" size={28} color={Colors.text.dim} />

            <View style={styles.twin}>
              <MaterialCommunityIcons
                name="earth"
                size={48}
                color={projectedTotal < currentTotal ? Colors.carbon.low : Colors.carbon.high}
              />
              <Text variant="caption" color="muted">
                With Changes
              </Text>
              <Text
                style={[
                  styles.twinValue,
                  { color: projectedTotal < currentTotal ? Colors.carbon.low : Colors.carbon.high },
                ]}
              >
                {formatCarbonKg(projectedTotal)}
              </Text>
              <Text variant="caption" color="muted">
                per month
              </Text>
            </View>
          </View>

          {totalSavings > 0 && (
            <View style={styles.savings}>
              <MaterialCommunityIcons name="trending-down" size={20} color={Colors.carbon.low} />
              <Text style={styles.savingsText}>
                {reductionPercent}% reduction · Saving {formatCarbonKg(totalSavings)}/month
              </Text>
            </View>
          )}
        </Card>

        {/* What-if Toggles */}
        <View style={styles.section}>
          <Text variant="title">What if you...</Text>
          {changes.map(change => (
            <View key={change.id} style={styles.changeRow}>
              <View style={[styles.changeIcon, { backgroundColor: `${Colors.emerald[500]}15` }]}>
                <MaterialCommunityIcons name={change.icon as any} size={20} color={Colors.emerald[500]} />
              </View>
              <View style={styles.changeInfo}>
                <Text variant="body" weight="medium">
                  {change.label}
                </Text>
                <Text variant="caption" color="muted">
                  {change.description}
                </Text>
                <Text variant="caption" style={{ color: Colors.carbon.low }}>
                  Saves ~{formatCarbonKg(change.savingsPerMonth)}/month
                </Text>
              </View>
              <Switch
                value={change.enabled}
                onValueChange={() => toggleChange(change.id)}
                trackColor={{
                  false: Colors.background.elevated,
                  true: `${Colors.emerald[500]}60`,
                }}
                thumbColor={change.enabled ? Colors.emerald[500] : Colors.text.dim}
              />
            </View>
          ))}
        </View>

        {/* Time Machine */}
        {totalSavings > 0 && (
          <Card variant="elevated">
            <Text variant="label" color="muted" style={styles.twinLabel}>
              Carbon Time Machine · 5 Years
            </Text>
            <View style={styles.timeMachine}>
              <View style={styles.timeBlock}>
                <Text style={[styles.timeValue, { color: Colors.carbon.high }]}>
                  {formatCarbonKg(fiveYearCurrent)}
                </Text>
                <Text variant="caption" color="muted">
                  Current path
                </Text>
              </View>
              <MaterialCommunityIcons name="minus" size={20} color={Colors.text.dim} />
              <View style={styles.timeBlock}>
                <Text style={[styles.timeValue, { color: Colors.carbon.low }]}>
                  {formatCarbonKg(fiveYearProjected)}
                </Text>
                <Text variant="caption" color="muted">
                  With changes
                </Text>
              </View>
            </View>

            <View style={styles.timeEquivalents}>
              <View style={styles.timeEquiv}>
                <MaterialCommunityIcons name="tree" size={20} color={Colors.carbon.low} />
                <Text variant="caption" color="muted">
                  {carbonToTrees(fiveYearSavings * 12)} trees saved
                </Text>
              </View>
              <View style={styles.timeEquiv}>
                <MaterialCommunityIcons name="airplane" size={20} color={Colors.info} />
                <Text variant="caption" color="muted">
                  {carbonToFlights(fiveYearSavings)} fewer flights
                </Text>
              </View>
            </View>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.base,
    gap: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  scrollContent: {
    padding: Spacing['2xl'],
    gap: Spacing.xl,
    paddingBottom: Spacing['4xl'],
  },
  twinLabel: {
    marginBottom: Spacing.base,
  },
  twinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: Spacing.base,
  },
  twin: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  twinValue: {
    fontSize: FontSize['2xl'],
    fontWeight: '800',
  },
  savings: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: `${Colors.carbon.low}15`,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginTop: Spacing.sm,
  },
  savingsText: {
    color: Colors.carbon.low,
    fontSize: FontSize.sm,
    fontWeight: '500',
  },
  section: {
    gap: Spacing.md,
  },
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
  changeIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeInfo: {
    flex: 1,
    gap: 2,
  },
  timeMachine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: Spacing.base,
  },
  timeBlock: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  timeValue: {
    fontSize: FontSize['2xl'],
    fontWeight: '800',
  },
  timeEquivalents: {
    gap: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    paddingTop: Spacing.md,
  },
  timeEquiv: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
});
