import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/hooks/useAuth';
import { formatCarbonKg } from '@/utils/carbon';
import { Colors, Spacing, BorderRadius, FontSize } from '@/constants/theme';

type Scope = 'global' | 'friends';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  carbonKg: number;
  reductionPercent: number;
  streak: number;
  isCurrentUser: boolean;
}

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, userId: '1', displayName: 'Sarah K.', carbonKg: 98, reductionPercent: 42, streak: 21, isCurrentUser: false },
  { rank: 2, userId: '2', displayName: 'Marcus T.', carbonKg: 112, reductionPercent: 38, streak: 14, isCurrentUser: false },
  { rank: 3, userId: '3', displayName: 'Priya M.', carbonKg: 134, reductionPercent: 31, streak: 9, isCurrentUser: false },
  { rank: 4, userId: 'me', displayName: 'You', carbonKg: 168, reductionPercent: 22, streak: 5, isCurrentUser: true },
  { rank: 5, userId: '5', displayName: 'Alex R.', carbonKg: 187, reductionPercent: 18, streak: 3, isCurrentUser: false },
  { rank: 6, userId: '6', displayName: 'Emma L.', carbonKg: 201, reductionPercent: 12, streak: 1, isCurrentUser: false },
  { rank: 7, userId: '7', displayName: 'James O.', carbonKg: 223, reductionPercent: 8, streak: 0, isCurrentUser: false },
];

export default function LeaderboardScreen() {
  const { profile } = useAuth();
  const [scope, setScope] = useState<Scope>('global');

  const myEntry = MOCK_LEADERBOARD.find(e => e.isCurrentUser);

  const rankColors = ['#FFD700', '#C0C0C0', '#CD7F32'];
  const rankIcons = ['trophy', 'medal', 'medal-outline'];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text variant="heading">Leaderboard</Text>
        <Text variant="caption" color="muted">
          June 2026
        </Text>
      </View>

      <View style={styles.tabs}>
        {(['global', 'friends'] as const).map(s => (
          <TouchableOpacity
            key={s}
            style={[styles.tab, scope === s && styles.tabActive]}
            onPress={() => setScope(s)}
          >
            <Text
              variant="body"
              weight="semibold"
              style={scope === s ? styles.tabTextActive : styles.tabText}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top 3 Podium */}
        <View style={styles.podium}>
          {[1, 0, 2].map(i => {
            const entry = MOCK_LEADERBOARD[i];
            const isFirst = i === 0;
            return (
              <View key={i} style={[styles.podiumEntry, isFirst && styles.podiumFirst]}>
                <View style={[styles.podiumAvatar, { borderColor: rankColors[i] }]}>
                  <Text style={styles.podiumAvatarText}>
                    {entry.displayName.charAt(0)}
                  </Text>
                </View>
                <MaterialCommunityIcons
                  name={rankIcons[i] as any}
                  size={isFirst ? 28 : 22}
                  color={rankColors[i]}
                />
                <Text variant="caption" weight="semibold" numberOfLines={1} style={styles.podiumName}>
                  {entry.displayName}
                </Text>
                <Text variant="caption" style={{ color: Colors.carbon.low }}>
                  {formatCarbonKg(entry.carbonKg)}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Full List */}
        <View style={styles.list}>
          {MOCK_LEADERBOARD.map(entry => (
            <View
              key={entry.userId}
              style={[styles.entry, entry.isCurrentUser && styles.entryHighlighted]}
            >
              <Text
                style={[
                  styles.rank,
                  { color: entry.rank <= 3 ? rankColors[entry.rank - 1] : Colors.text.dim },
                ]}
              >
                {entry.rank}
              </Text>

              <View style={styles.entryAvatar}>
                <Text style={styles.entryAvatarText}>
                  {entry.displayName.charAt(0)}
                </Text>
              </View>

              <View style={styles.entryInfo}>
                <View style={styles.entryNameRow}>
                  <Text
                    variant="body"
                    weight={entry.isCurrentUser ? 'semibold' : 'regular'}
                    style={entry.isCurrentUser ? { color: Colors.emerald[400] } : undefined}
                  >
                    {entry.isCurrentUser ? `${profile?.display_name ?? 'You'} (you)` : entry.displayName}
                  </Text>
                  {entry.streak > 0 && (
                    <View style={styles.streak}>
                      <MaterialCommunityIcons name="fire" size={12} color={Colors.warning} />
                      <Text style={styles.streakText}>{entry.streak}</Text>
                    </View>
                  )}
                </View>
                <Text variant="caption" color="muted">
                  ↓ {entry.reductionPercent}% this month
                </Text>
              </View>

              <Text style={[styles.entryCarbon, { color: Colors.carbon.low }]}>
                {formatCarbonKg(entry.carbonKg)}
              </Text>
            </View>
          ))}
        </View>

        {/* My Stats Card */}
        {myEntry && (
          <Card variant="glow">
            <Text variant="label" color="muted" style={{ marginBottom: Spacing.md }}>
              Your Stats
            </Text>
            <View style={styles.myStats}>
              <View style={styles.myStat}>
                <Text style={styles.myStatValue}>#{myEntry.rank}</Text>
                <Text variant="caption" color="muted">
                  Rank
                </Text>
              </View>
              <View style={styles.myStatDivider} />
              <View style={styles.myStat}>
                <Text style={[styles.myStatValue, { color: Colors.carbon.low }]}>
                  {formatCarbonKg(myEntry.carbonKg)}
                </Text>
                <Text variant="caption" color="muted">
                  This Month
                </Text>
              </View>
              <View style={styles.myStatDivider} />
              <View style={styles.myStat}>
                <Text style={[styles.myStatValue, { color: Colors.carbon.low }]}>
                  ↓{myEntry.reductionPercent}%
                </Text>
                <Text variant="caption" color="muted">
                  Reduction
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
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.base,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: Spacing['2xl'],
    marginBottom: Spacing.base,
    gap: Spacing.sm,
  },
  tab: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabActive: {
    backgroundColor: Colors.emerald[500],
    borderColor: Colors.emerald[500],
  },
  tabText: {
    color: Colors.text.muted,
  },
  tabTextActive: {
    color: Colors.background.primary,
  },
  scrollContent: {
    paddingHorizontal: Spacing['2xl'],
    paddingBottom: Spacing['4xl'],
    gap: Spacing.xl,
  },
  podium: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: Spacing.base,
    paddingVertical: Spacing.xl,
  },
  podiumEntry: {
    alignItems: 'center',
    gap: Spacing.xs,
    flex: 1,
  },
  podiumFirst: {
    transform: [{ translateY: -16 }],
  },
  podiumAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.background.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  podiumAvatarText: {
    fontSize: FontSize.xl,
    color: Colors.text.primary,
    fontWeight: '700',
  },
  podiumName: {
    maxWidth: 80,
    textAlign: 'center',
  },
  list: {
    gap: Spacing.sm,
  },
  entry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  entryHighlighted: {
    borderColor: `${Colors.emerald[500]}60`,
    backgroundColor: `${Colors.emerald[500]}08`,
  },
  rank: {
    fontSize: FontSize.md,
    fontWeight: '700',
    minWidth: 24,
    textAlign: 'center',
  },
  entryAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.background.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryAvatarText: {
    fontSize: FontSize.base,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  entryInfo: {
    flex: 1,
    gap: 2,
  },
  entryNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: `${Colors.warning}15`,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  streakText: {
    fontSize: FontSize.xs,
    color: Colors.warning,
    fontWeight: '700',
  },
  entryCarbon: {
    fontSize: FontSize.base,
    fontWeight: '600',
  },
  myStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  myStat: {
    alignItems: 'center',
    gap: 2,
  },
  myStatValue: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.text.primary,
  },
  myStatDivider: {
    width: 1,
    height: 36,
    backgroundColor: Colors.divider,
  },
});
