import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { useChallenges } from '@/hooks/useChallenges';
import { useAuth } from '@/hooks/useAuth';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import type { BadgeRow, ChallengeRow, UserChallengeRow } from '@/types';
import { Colors, Spacing, BorderRadius, FontSize } from '@/constants/theme';

type TabId = 'active' | 'available' | 'badges';

const DIFFICULTY_BADGE_VARIANT = {
  easy: 'success',
  medium: 'warning',
  hard: 'error',
  expert: 'error',
} as const;

export default function ChallengesScreen() {
  const { profile } = useAuth();
  const {
    activeChallenges,
    availableChallenges,
    completedChallenges,
    allBadges,
    userBadges,
    earnedBadgeIds,
    isLoading,
    refresh,
    joinChallenge,
  } = useChallenges();

  const [activeTab, setActiveTab] = useState<TabId>('active');
  const { isDesktop } = useBreakpoint();

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleJoin(challengeId: string, title: string) {
    try {
      await joinChallenge(challengeId);
      Alert.alert('Challenge Started!', `You've joined "${title}". Good luck! 🌿`);
      setActiveTab('active');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to join';
      Alert.alert('Error', msg);
    }
  }

  const tabs: Array<{ id: TabId; label: string; count?: number }> = [
    { id: 'active', label: 'Active', count: activeChallenges.length },
    { id: 'available', label: 'Available', count: availableChallenges.length },
    { id: 'badges', label: 'Badges', count: userBadges.length },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text variant="heading">Challenges</Text>
        <View style={styles.streakContainer}>
          <MaterialCommunityIcons name="fire" size={20} color={Colors.warning} />
          <Text style={styles.streakValue}>{profile?.current_streak ?? 0}</Text>
          <Text variant="caption" color="muted">
            day streak
          </Text>
        </View>
      </View>

      <View style={styles.tabs}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => setActiveTab(tab.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === tab.id }}
            accessibilityLabel={tab.count !== undefined && tab.count > 0 ? `${tab.label}, ${tab.count} items` : tab.label}
          >
            <Text
              variant="body"
              weight="semibold"
              style={activeTab === tab.id ? styles.tabTextActive : styles.tabText}
              accessible={false}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 ? ` (${tab.count})` : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, isDesktop && styles.scrollContentDesktop]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor={Colors.emerald[500]} />
        }
      >
        {activeTab === 'active' && (
          <>
            {activeChallenges.length === 0 ? (
              <EmptyState
                icon="trophy-outline"
                title="No active challenges"
                description="Join a challenge to start building eco-habits."
                actionLabel="Browse Challenges"
                onAction={() => setActiveTab('available')}
              />
            ) : (
              <View style={[styles.cardList, isDesktop && styles.cardGrid]}>
                {activeChallenges.map(uc => (
                  <View key={uc.id} style={isDesktop && styles.cardGridItem}>
                    <ActiveChallengeCard userChallenge={uc} />
                  </View>
                ))}
              </View>
            )}
            {completedChallenges.length > 0 && (
              <View style={styles.completedSection}>
                <Text variant="label" color="muted">
                  Completed
                </Text>
                {completedChallenges.map(uc => (
                  <CompletedChallengeCard key={uc.id} userChallenge={uc} />
                ))}
              </View>
            )}
          </>
        )}

        {activeTab === 'available' && (
          <>
            {isLoading ? (
              <LoadingSpinner label="Loading challenges..." />
            ) : availableChallenges.length === 0 ? (
              <EmptyState
                icon="check-circle"
                title="All caught up!"
                description="You've joined all available challenges."
              />
            ) : (
              <View style={[styles.cardList, isDesktop && styles.cardGrid]}>
                {availableChallenges.map(challenge => (
                  <View key={challenge.id} style={isDesktop && styles.cardGridItem}>
                    <AvailableChallengeCard
                      challenge={challenge}
                      onJoin={() => handleJoin(challenge.id, challenge.title)}
                    />
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {activeTab === 'badges' && (
          <View style={styles.badgeGrid}>
            {allBadges.map((badge) => {
              const earned = earnedBadgeIds.has(badge.id);
              return (
                <BadgeCard key={badge.id} badge={badge} earned={earned} />
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

type UserChallengeWithChallenge = UserChallengeRow & { challenge?: ChallengeRow };

function ActiveChallengeCard({ userChallenge }: { userChallenge: UserChallengeWithChallenge }) {
  const challenge: ChallengeRow | undefined = userChallenge.challenge;
  if (!challenge) return null;

  const progress = userChallenge.progress ?? 0;
  const target = challenge.target_value;
  const progressPct = Math.min(progress / target, 1);

  const started = new Date(userChallenge.started_at);
  const end = new Date(started.getTime() + challenge.duration_days * 86400000);
  const daysLeft = Math.max(0, Math.ceil((end.getTime() - Date.now()) / 86400000));

  return (
    <Card variant="elevated" style={challengeCardStyles.card}>
      <View style={challengeCardStyles.header}>
        <View style={[challengeCardStyles.icon, { backgroundColor: `${Colors.emerald[500]}20` }]}>
          <MaterialCommunityIcons name={challenge.icon as any} size={22} color={Colors.emerald[500]} />
        </View>
        <View style={challengeCardStyles.info}>
          <View style={challengeCardStyles.titleRow}>
            <Text variant="body" weight="semibold" numberOfLines={1} style={{ flex: 1 }}>
              {challenge.title}
            </Text>
            <Badge
              label={challenge.difficulty}
              variant={DIFFICULTY_BADGE_VARIANT[challenge.difficulty] ?? 'neutral'}
            />
          </View>
          <Text variant="caption" color="muted" numberOfLines={1}>
            {challenge.description}
          </Text>
        </View>
      </View>

      <View style={challengeCardStyles.progress}>
        <View style={challengeCardStyles.progressHeader}>
          <Text variant="caption" color="muted">
            {progress}/{target} {challenge.target_unit}
          </Text>
          <Text variant="caption" color="muted">
            {daysLeft === 0 ? 'Last day!' : `${daysLeft}d left`}
          </Text>
        </View>
        <ProgressBar progress={progressPct} color={Colors.emerald[500]} height={5} />
      </View>

      <View style={challengeCardStyles.footer}>
        <View style={challengeCardStyles.reward}>
          <MaterialCommunityIcons name="star" size={14} color={Colors.warning} />
          <Text variant="caption" style={{ color: Colors.warning }}>
            {challenge.reward_points} pts
          </Text>
        </View>
        <Text variant="caption" style={{ color: Colors.emerald[500] }}>
          {(progressPct * 100).toFixed(0)}% done
        </Text>
      </View>
    </Card>
  );
}

function CompletedChallengeCard({ userChallenge }: { userChallenge: UserChallengeWithChallenge }) {
  const challenge: ChallengeRow | undefined = userChallenge.challenge;
  if (!challenge) return null;
  return (
    <View style={challengeCardStyles.completedRow}>
      <MaterialCommunityIcons name="check-circle" size={18} color={Colors.emerald[500]} />
      <Text variant="body" color="muted" style={{ flex: 1 }}>
        {challenge.title}
      </Text>
      <MaterialCommunityIcons name="star" size={14} color={Colors.warning} />
      <Text variant="caption" style={{ color: Colors.warning }}>
        +{challenge.reward_points}
      </Text>
    </View>
  );
}

function AvailableChallengeCard({
  challenge,
  onJoin,
}: {
  challenge: ChallengeRow;
  onJoin: () => void;
}) {
  return (
    <Card variant="elevated" style={challengeCardStyles.card}>
      <View style={challengeCardStyles.header}>
        <View style={[challengeCardStyles.icon, { backgroundColor: `${Colors.emerald[700]}30` }]}>
          <MaterialCommunityIcons name={challenge.icon as any} size={22} color={Colors.emerald[600]} />
        </View>
        <View style={challengeCardStyles.info}>
          <View style={challengeCardStyles.titleRow}>
            <Text variant="body" weight="semibold" style={{ flex: 1 }}>
              {challenge.title}
            </Text>
            <Badge
              label={challenge.difficulty}
              variant={DIFFICULTY_BADGE_VARIANT[challenge.difficulty] ?? 'neutral'}
            />
          </View>
          <Text variant="caption" color="muted">
            {challenge.description}
          </Text>
        </View>
      </View>

      <View style={challengeCardStyles.footer}>
        <View style={challengeCardStyles.reward}>
          <MaterialCommunityIcons name="star" size={14} color={Colors.warning} />
          <Text variant="caption" style={{ color: Colors.warning }}>
            {challenge.reward_points} pts
          </Text>
          <Text variant="caption" color="muted">
            · {challenge.duration_days} days
          </Text>
        </View>
        <TouchableOpacity
          style={challengeCardStyles.joinButton}
          onPress={onJoin}
          accessibilityRole="button"
          accessibilityLabel={`Start challenge: ${challenge.title}`}
        >
          <Text variant="caption" color="secondary" weight="semibold" accessible={false}>
            Start Challenge
          </Text>
        </TouchableOpacity>
      </View>
    </Card>
  );
}

function BadgeCard({ badge, earned }: { badge: BadgeRow; earned: boolean }) {
  const RARITY_COLORS: Record<string, string> = {
    common: Colors.text.dim,
    rare: Colors.info,
    epic: '#a855f7',
    legendary: Colors.warning,
  };
  const rarityColor = RARITY_COLORS[badge.rarity] ?? Colors.text.dim;

  return (
    <View style={[badgeStyles.card, !earned && badgeStyles.locked]}>
      <Text style={badgeStyles.icon}>{badge.icon}</Text>
      <Text
        variant="caption"
        weight="semibold"
        style={[badgeStyles.name, !earned && badgeStyles.lockedText]}
        numberOfLines={1}
      >
        {badge.name}
      </Text>
      <Text variant="caption" color="muted" style={badgeStyles.desc} numberOfLines={2}>
        {badge.description}
      </Text>
      <View style={[badgeStyles.rarityBadge, { borderColor: rarityColor }]}>
        <Text style={[badgeStyles.rarityText, { color: rarityColor }]}>
          {badge.rarity}
        </Text>
      </View>
      {earned && (
        <MaterialCommunityIcons
          name="check-circle"
          size={16}
          color={Colors.emerald[500]}
          style={badgeStyles.earnedIcon}
        />
      )}
    </View>
  );
}

const challengeCardStyles = StyleSheet.create({
  card: { gap: Spacing.md },
  header: { flexDirection: 'row', gap: Spacing.md },
  icon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1, gap: 3 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.sm },
  progress: { gap: Spacing.xs },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    paddingTop: Spacing.sm,
  },
  reward: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  joinButton: {
    backgroundColor: `${Colors.emerald[500]}15`,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: `${Colors.emerald[500]}40`,
  },
  completedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: `${Colors.emerald[700]}40`,
  },
});

const badgeStyles = StyleSheet.create({
  card: {
    width: '47%',
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    alignItems: 'center',
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: `${Colors.emerald[500]}30`,
    position: 'relative',
  },
  locked: { opacity: 0.45, borderColor: Colors.border },
  icon: { fontSize: 36 },
  name: { textAlign: 'center' },
  lockedText: { color: Colors.text.dim },
  desc: { textAlign: 'center', lineHeight: 16 },
  rarityBadge: {
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginTop: 2,
  },
  rarityText: { fontSize: FontSize.xs, fontWeight: '600', textTransform: 'capitalize' },
  earnedIcon: { position: 'absolute', top: Spacing.sm, right: Spacing.sm },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.base,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${Colors.warning}15`,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  streakValue: { color: Colors.warning, fontSize: FontSize.md, fontWeight: '700' },
  tabs: { flexDirection: 'row', paddingHorizontal: Spacing['2xl'], marginBottom: Spacing.base, gap: Spacing.sm },
  tab: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabActive: { backgroundColor: Colors.emerald[500], borderColor: Colors.emerald[500] },
  tabText: { color: Colors.text.muted },
  tabTextActive: { color: Colors.background.primary },
  scrollContent: {
    paddingHorizontal: Spacing['2xl'],
    paddingBottom: Spacing['4xl'],
    gap: Spacing.md,
  },
  scrollContentDesktop: {
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  cardList: { gap: Spacing.md },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.base,
  },
  cardGridItem: {
    flex: 1,
    minWidth: 340,
  },
  completedSection: { gap: Spacing.sm, marginTop: Spacing.md },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
});
