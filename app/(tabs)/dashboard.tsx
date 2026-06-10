import React, { useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { CategoryBreakdown } from '@/components/carbon/CategoryBreakdown';
import { ActivityCard } from '@/components/carbon/ActivityCard';
import { RecommendationCard } from '@/components/carbon/RecommendationCard';
import { GoalCard } from '@/components/carbon/GoalCard';
import { useAuth } from '@/hooks/useAuth';
import { useCarbon } from '@/hooks/useCarbon';
import { useRecommendations } from '@/hooks/useRecommendations';
import { useGoals } from '@/hooks/useGoals';
import {
  formatCarbonKg,
  getCarbonLevel,
  carbonToTrees,
  carbonToFlights,
  getVsGlobalAverage,
} from '@/utils/carbon';
import { getMonthLabel } from '@/utils/date';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';

export default function DashboardScreen() {
  const { profile } = useAuth();
  const { activities, currentMonthBreakdown, previousMonthBreakdown, isLoading, refresh, remove, reductionVsPrevious } =
    useCarbon();
  const { recommendations, refresh: refreshRecs, markRead, dismiss } = useRecommendations();
  const { activeGoals, refresh: refreshGoals, sync: syncGoals } = useGoals();

  const refreshAll = useCallback(async () => {
    await Promise.all([refresh(), refreshRecs(), refreshGoals()]);
  }, [refresh, refreshRecs, refreshGoals]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Sync goal progress whenever breakdown changes
  useEffect(() => {
    if (currentMonthBreakdown.total > 0) {
      syncGoals(currentMonthBreakdown as unknown as Record<string, number>).catch(() => {});
    }
  }, [currentMonthBreakdown, syncGoals]);

  const goal = profile?.monthly_carbon_goal ?? 200;
  const total = currentMonthBreakdown.total;
  const level = getCarbonLevel(total);
  const vsAverage = getVsGlobalAverage(total);
  const goalProgress = Math.min(total / goal, 1);

  const levelColors = {
    low: Colors.carbon.low,
    medium: Colors.carbon.medium,
    high: Colors.carbon.high,
    critical: Colors.carbon.critical,
  };
  const levelColor = levelColors[level];

  if (isLoading && activities.length === 0) {
    return <LoadingSpinner fullScreen label="Loading your dashboard..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refreshAll} tintColor={Colors.emerald[500]} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text variant="caption" color="muted">
              {getMonthLabel(new Date())}
            </Text>
            <Text variant="title">
              Hey {profile?.display_name?.split(' ')[0] ?? 'there'} 👋
            </Text>
          </View>
          <View style={styles.headerActions}>
            {(profile?.current_streak ?? 0) > 0 && (
              <View style={styles.streakBadge}>
                <MaterialCommunityIcons name="fire" size={16} color={Colors.warning} />
                <Text style={styles.streakText}>{profile?.current_streak ?? 0}</Text>
              </View>
            )}
            <TouchableOpacity onPress={() => router.push('/settings')}>
              <MaterialCommunityIcons name="cog-outline" size={24} color={Colors.text.muted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Carbon Hero Card */}
        <LinearGradient
          colors={[Colors.background.card, `${levelColor}15`, Colors.background.card]}
          style={styles.heroCard}
        >
          <View style={styles.heroTop}>
            <View>
              <Text variant="label" color="muted">This month</Text>
              <Text style={[styles.heroValue, { color: levelColor }]}>
                {formatCarbonKg(total)}
              </Text>
              <Text variant="caption" color="muted">CO₂ equivalent</Text>
            </View>
            <Badge
              label={level.toUpperCase()}
              variant={level === 'low' ? 'success' : level === 'medium' ? 'warning' : 'error'}
            />
          </View>

          <View style={styles.goalSection}>
            <View style={styles.goalHeader}>
              <Text variant="caption" color="muted">
                Monthly goal: {formatCarbonKg(goal)}
              </Text>
              <Text variant="caption" style={{ color: levelColor }}>
                {(goalProgress * 100).toFixed(0)}%
              </Text>
            </View>
            <ProgressBar progress={goalProgress} color={levelColor} height={6} />
          </View>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text variant="caption" color="muted">vs. last month</Text>
              <Text
                style={[
                  styles.statValue,
                  { color: reductionVsPrevious > 0 ? Colors.carbon.low : Colors.carbon.high },
                ]}
              >
                {reductionVsPrevious > 0 ? '↓' : '↑'} {Math.abs(reductionVsPrevious).toFixed(0)}%
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text variant="caption" color="muted">vs. average</Text>
              <Text
                style={[
                  styles.statValue,
                  { color: vsAverage < 0 ? Colors.carbon.low : Colors.carbon.high },
                ]}
              >
                {vsAverage > 0 ? '+' : ''}{vsAverage}%
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text variant="caption" color="muted">trees needed</Text>
              <Text style={[styles.statValue, { color: Colors.emerald[400] }]}>
                {carbonToTrees(total)}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <QuickActionButton
            icon="plus"
            label="Log Activity"
            color={Colors.emerald[500]}
            onPress={() => router.push('/(tabs)/log')}
          />
          <QuickActionButton
            icon="receipt"
            label="Scan Receipt"
            color={Colors.info}
            onPress={() => router.push('/receipt-scanner')}
          />
          <QuickActionButton
            icon="chart-timeline-variant"
            label="Simulator"
            color={Colors.warning}
            onPress={() => router.push('/simulator')}
          />
          <QuickActionButton
            icon="robot"
            label="AI Coach"
            color={Colors.emerald[400]}
            onPress={() => router.push('/(tabs)/coach')}
          />
        </View>

        {/* AI Recommendations */}
        {recommendations.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text variant="title">AI Insights</Text>
              <MaterialCommunityIcons name="robot" size={18} color={Colors.emerald[500]} />
            </View>
            {recommendations.slice(0, 2).map(rec => (
              <RecommendationCard
                key={rec.id}
                recommendation={rec}
                onDismiss={dismiss}
                onRead={markRead}
              />
            ))}
          </View>
        )}

        {/* Active Goals */}
        {activeGoals.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text variant="title">Goals</Text>
              <TouchableOpacity onPress={() => router.push('/goals')}>
                <Text variant="caption" color="secondary">Manage</Text>
              </TouchableOpacity>
            </View>
            {activeGoals.slice(0, 2).map(goal => (
              <GoalCard key={goal.id} goal={goal} />
            ))}
          </View>
        )}

        {/* Category Breakdown */}
        <CategoryBreakdown breakdown={currentMonthBreakdown} />

        {/* Equivalents */}
        {total > 0 && (
          <Card variant="outlined">
            <Text variant="label" color="muted" style={styles.sectionLabel}>
              What this means
            </Text>
            <View style={styles.equivalents}>
              <View style={styles.equivalent}>
                <MaterialCommunityIcons name="airplane" size={24} color={Colors.info} />
                <Text variant="caption" color="muted" style={{ flex: 1 }}>
                  = {carbonToFlights(total)} short-haul flights
                </Text>
              </View>
              <View style={styles.equivalent}>
                <MaterialCommunityIcons name="tree" size={24} color={Colors.carbon.low} />
                <Text variant="caption" color="muted" style={{ flex: 1 }}>
                  {carbonToTrees(total)} trees to offset this month
                </Text>
              </View>
            </View>
          </Card>
        )}

        {/* Recent Activities */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text variant="title">Recent</Text>
            {activities.length > 5 && (
              <TouchableOpacity onPress={() => router.push('/(tabs)/log')}>
                <Text variant="caption" color="secondary">View all</Text>
              </TouchableOpacity>
            )}
          </View>
          {activities.length === 0 ? (
            <Card variant="outlined">
              <Text variant="body" color="muted" style={styles.noActivities}>
                No activities logged this month. Start tracking!
              </Text>
            </Card>
          ) : (
            <View style={styles.activityList}>
              {activities.slice(0, 5).map(activity => (
                <ActivityCard key={activity.id} activity={activity} onDelete={remove} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function QuickActionButton({
  icon,
  label,
  color,
  onPress,
}: {
  icon: string;
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.quickAction} onPress={onPress}>
      <View style={[styles.quickActionIcon, { backgroundColor: `${color}20` }]}>
        <MaterialCommunityIcons name={icon as any} size={22} color={color} />
      </View>
      <Text variant="caption" color="secondary">{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  scrollContent: { padding: Spacing['2xl'], gap: Spacing.base, paddingBottom: Spacing['4xl'] },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.warning}20`,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    gap: 3,
  },
  streakText: { color: Colors.warning, fontSize: FontSize.sm, fontWeight: '700' },
  heroCard: {
    borderRadius: 20,
    padding: Spacing.xl,
    gap: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  heroValue: { fontSize: FontSize['4xl'], fontWeight: '800', lineHeight: 48 },
  goalSection: { gap: Spacing.xs },
  goalHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  stat: { alignItems: 'center', gap: 2 },
  statValue: { fontSize: FontSize.md, fontWeight: '700' },
  statDivider: { width: 1, height: 30, backgroundColor: Colors.divider },
  quickActions: { flexDirection: 'row', justifyContent: 'space-between' },
  quickAction: { alignItems: 'center', gap: Spacing.xs },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: { gap: Spacing.md },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionLabel: { marginBottom: Spacing.md },
  equivalents: { gap: Spacing.md },
  equivalent: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  activityList: { gap: Spacing.sm },
  noActivities: { textAlign: 'center', padding: Spacing.base },
});
