import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { useLeaderboardStore } from '@/stores/leaderboardStore';
import { useAuth } from '@/hooks/useAuth';
import { useCarbon } from '@/hooks/useCarbon';
import { formatCarbonKg } from '@/utils/carbon';
import { Colors, Spacing, BorderRadius, FontSize } from '@/constants/theme';

export default function LeaderboardScreen() {
  const { user, profile } = useAuth();
  const { currentMonthBreakdown, reductionVsPrevious } = useCarbon();
  const { entries, isLoading, fetchLeaderboard } = useLeaderboardStore();

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const myEntry = entries.find(e => e.user_id === user?.id);
  const myRank = myEntry?.rank ?? null;

  const rankColors = ['#FFD700', '#C0C0C0', '#CD7F32'];
  const rankIcons = ['trophy', 'medal', 'medal-outline'];

  function getDisplayName(entry: any): string {
    if (entry.user_id === user?.id) return profile?.display_name ?? 'You';
    return (entry.user?.display_name ?? `User ${entry.user_id.slice(0, 6)}`) as string;
  }

  function getInitial(entry: any): string {
    return getDisplayName(entry).charAt(0).toUpperCase();
  }

  if (isLoading && entries.length === 0) {
    return <LoadingSpinner fullScreen label="Loading leaderboard..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text variant="heading">Leaderboard</Text>
        <Text variant="caption" color="muted">
          {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={() => fetchLeaderboard()} tintColor={Colors.emerald[500]} />
        }
      >
        {entries.length === 0 ? (
          <EmptyState
            icon="podium"
            title="No data yet"
            description="Log activities to appear on the leaderboard. Rankings update as you track your footprint."
          />
        ) : (
          <>
            {/* Top 3 podium */}
            {entries.length >= 3 && (
              <View style={styles.podium}>
                {[1, 0, 2].map(i => {
                  const entry = entries[i];
                  if (!entry) return null;
                  const isFirst = i === 0;
                  const isMe = entry.user_id === user?.id;
                  return (
                    <View key={entry.id} style={[styles.podiumEntry, isFirst && styles.podiumFirst]}>
                      <View
                        style={[
                          styles.podiumAvatar,
                          { borderColor: rankColors[i] },
                          isMe && styles.podiumAvatarMe,
                        ]}
                      >
                        <Text style={styles.podiumAvatarText}>{getInitial(entry)}</Text>
                      </View>
                      <MaterialCommunityIcons
                        name={rankIcons[i] as any}
                        size={isFirst ? 28 : 22}
                        color={rankColors[i]}
                      />
                      <Text variant="caption" weight="semibold" numberOfLines={1} style={styles.podiumName}>
                        {isMe ? 'You' : getDisplayName(entry)}
                      </Text>
                      <Text variant="caption" style={{ color: Colors.carbon.low }}>
                        {formatCarbonKg(entry.carbon_kg)}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Full ranked list */}
            <View style={styles.list}>
              {entries.map(entry => {
                const isMe = entry.user_id === user?.id;
                const streak = entry.user?.current_streak ?? 0;
                return (
                  <View key={entry.id} style={[styles.entryRow, isMe && styles.entryRowMe]}>
                    <Text
                      style={[
                        styles.rank,
                        {
                          color:
                            (entry.rank ?? 0) <= 3
                              ? rankColors[(entry.rank ?? 1) - 1]
                              : Colors.text.dim,
                        },
                      ]}
                    >
                      {entry.rank}
                    </Text>
                    <View style={styles.entryAvatar}>
                      <Text style={styles.entryAvatarText}>{getInitial(entry)}</Text>
                    </View>
                    <View style={styles.entryInfo}>
                      <View style={styles.nameRow}>
                        <Text
                          variant="body"
                          weight={isMe ? 'semibold' : 'regular'}
                          style={isMe ? { color: Colors.emerald[400] } : undefined}
                          numberOfLines={1}
                        >
                          {isMe ? `${getDisplayName(entry)} (you)` : getDisplayName(entry)}
                        </Text>
                        {streak > 0 && (
                          <View style={styles.streak}>
                            <MaterialCommunityIcons name="fire" size={12} color={Colors.warning} />
                            <Text style={styles.streakText}>{streak}</Text>
                          </View>
                        )}
                      </View>
                      <Text variant="caption" color="muted">
                        ↓ {entry.reduction_percentage.toFixed(0)}% this month
                      </Text>
                    </View>
                    <Text style={styles.entryCarbon}>
                      {formatCarbonKg(entry.carbon_kg)}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* My stats summary */}
            <Card variant="glow">
              <Text variant="label" color="muted" style={{ marginBottom: Spacing.md }}>
                Your Stats
              </Text>
              <View style={styles.myStats}>
                <View style={styles.myStat}>
                  <Text style={styles.myStatValue}>
                    {myRank != null ? `#${myRank}` : '—'}
                  </Text>
                  <Text variant="caption" color="muted">Rank</Text>
                </View>
                <View style={styles.myStatDivider} />
                <View style={styles.myStat}>
                  <Text style={[styles.myStatValue, { color: Colors.carbon.low }]}>
                    {formatCarbonKg(currentMonthBreakdown.total)}
                  </Text>
                  <Text variant="caption" color="muted">This Month</Text>
                </View>
                <View style={styles.myStatDivider} />
                <View style={styles.myStat}>
                  <Text
                    style={[
                      styles.myStatValue,
                      { color: reductionVsPrevious > 0 ? Colors.carbon.low : Colors.carbon.high },
                    ]}
                  >
                    {reductionVsPrevious > 0 ? '↓' : '↑'}{Math.abs(reductionVsPrevious).toFixed(0)}%
                  </Text>
                  <Text variant="caption" color="muted">vs. Last Month</Text>
                </View>
              </View>
            </Card>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  header: {
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.base,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scrollContent: { paddingHorizontal: Spacing['2xl'], paddingBottom: Spacing['4xl'], gap: Spacing.xl },
  podium: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: Spacing.base,
    paddingVertical: Spacing.xl,
  },
  podiumEntry: { alignItems: 'center', gap: Spacing.xs, flex: 1 },
  podiumFirst: { transform: [{ translateY: -16 }] },
  podiumAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.background.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  podiumAvatarMe: { borderColor: Colors.emerald[500] },
  podiumAvatarText: { fontSize: FontSize.xl, color: Colors.text.primary, fontWeight: '700' },
  podiumName: { maxWidth: 80, textAlign: 'center' },
  list: { gap: Spacing.sm },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  entryRowMe: {
    borderColor: `${Colors.emerald[500]}60`,
    backgroundColor: `${Colors.emerald[500]}08`,
  },
  rank: { fontSize: FontSize.md, fontWeight: '700', minWidth: 24, textAlign: 'center' },
  entryAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.background.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryAvatarText: { fontSize: FontSize.base, color: Colors.text.secondary, fontWeight: '600' },
  entryInfo: { flex: 1, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: `${Colors.warning}15`,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  streakText: { fontSize: FontSize.xs, color: Colors.warning, fontWeight: '700' },
  entryCarbon: { fontSize: FontSize.base, fontWeight: '600', color: Colors.carbon.low },
  myStats: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  myStat: { alignItems: 'center', gap: 2 },
  myStatValue: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.text.primary },
  myStatDivider: { width: 1, height: 36, backgroundColor: Colors.divider },
});
