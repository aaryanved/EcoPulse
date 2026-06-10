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
import { ProgressBar } from '@/components/ui/ProgressBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuth } from '@/hooks/useAuth';
import { Colors, Spacing, BorderRadius, FontSize } from '@/constants/theme';

interface Challenge {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  progress: number;
  target: number;
  targetUnit: string;
  daysLeft: number;
  difficulty: 'easy' | 'medium' | 'hard';
  rewardPoints: number;
  isActive: boolean;
}

const MOCK_CHALLENGES: Challenge[] = [
  {
    id: '1',
    title: 'Public Transit Week',
    description: 'Use public transport for all your commutes this week',
    icon: 'bus',
    category: 'transport',
    progress: 4,
    target: 7,
    targetUnit: 'days',
    daysLeft: 3,
    difficulty: 'easy',
    rewardPoints: 50,
    isActive: true,
  },
  {
    id: '2',
    title: 'Meat-Free Days',
    description: 'Skip meat for 5 days this week',
    icon: 'leaf',
    category: 'food',
    progress: 2,
    target: 5,
    targetUnit: 'days',
    daysLeft: 4,
    difficulty: 'medium',
    rewardPoints: 75,
    isActive: true,
  },
  {
    id: '3',
    title: 'Energy Saver',
    description: 'Reduce your electricity usage by 15% this month',
    icon: 'lightning-bolt',
    category: 'electricity',
    progress: 0,
    target: 15,
    targetUnit: '% reduction',
    daysLeft: 18,
    difficulty: 'hard',
    rewardPoints: 150,
    isActive: false,
  },
  {
    id: '4',
    title: 'Zero Waste Week',
    description: 'Minimize single-use items for a full week',
    icon: 'recycle',
    category: 'waste',
    progress: 0,
    target: 7,
    targetUnit: 'days',
    daysLeft: 7,
    difficulty: 'medium',
    rewardPoints: 100,
    isActive: false,
  },
];

const BADGES = [
  { id: '1', icon: '🌱', name: 'First Step', description: 'Logged your first activity', earned: true },
  { id: '2', icon: '🚌', name: 'Transit Hero', description: 'Used public transit 5 days in a row', earned: true },
  { id: '3', icon: '🌿', name: 'Plant Eater', description: 'Had 7 meat-free days', earned: false },
  { id: '4', icon: '⚡', name: 'Energy Wizard', description: 'Reduced electricity by 20%', earned: false },
  { id: '5', icon: '🔥', name: 'On Fire', description: 'Maintained a 14-day streak', earned: false },
  { id: '6', icon: '🌍', name: 'Earth Guardian', description: 'Reduced footprint by 30%', earned: false },
];

export default function ChallengesScreen() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'challenges' | 'badges'>('challenges');

  const activeChallenges = MOCK_CHALLENGES.filter(c => c.isActive);
  const availableChallenges = MOCK_CHALLENGES.filter(c => !c.isActive);

  const difficultyColor = {
    easy: Colors.carbon.low,
    medium: Colors.carbon.medium,
    hard: Colors.carbon.high,
  };

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
        <TouchableOpacity
          style={[styles.tab, activeTab === 'challenges' && styles.tabActive]}
          onPress={() => setActiveTab('challenges')}
        >
          <Text
            variant="body"
            weight="semibold"
            style={activeTab === 'challenges' ? styles.tabTextActive : styles.tabText}
          >
            Challenges
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'badges' && styles.tabActive]}
          onPress={() => setActiveTab('badges')}
        >
          <Text
            variant="body"
            weight="semibold"
            style={activeTab === 'badges' ? styles.tabTextActive : styles.tabText}
          >
            Badges
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'challenges' && (
          <>
            {activeChallenges.length > 0 && (
              <View style={styles.section}>
                <Text variant="title">Active</Text>
                {activeChallenges.map(challenge => (
                  <ChallengeCard key={challenge.id} challenge={challenge} difficultyColor={difficultyColor} />
                ))}
              </View>
            )}

            <View style={styles.section}>
              <Text variant="title">Available</Text>
              {availableChallenges.length === 0 ? (
                <EmptyState
                  icon="trophy"
                  title="You're crushing it!"
                  description="All challenges are active. Complete them to unlock more."
                />
              ) : (
                availableChallenges.map(challenge => (
                  <ChallengeCard key={challenge.id} challenge={challenge} difficultyColor={difficultyColor} showJoin />
                ))
              )}
            </View>
          </>
        )}

        {activeTab === 'badges' && (
          <View style={styles.badgeGrid}>
            {BADGES.map(badge => (
              <View key={badge.id} style={[styles.badgeCard, !badge.earned && styles.badgeCardLocked]}>
                <Text style={styles.badgeIcon}>{badge.icon}</Text>
                <Text
                  variant="caption"
                  weight="semibold"
                  style={badge.earned ? undefined : styles.lockedText}
                >
                  {badge.name}
                </Text>
                <Text variant="caption" color="muted" style={styles.badgeDescription}>
                  {badge.description}
                </Text>
                {badge.earned && (
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={16}
                    color={Colors.emerald[500]}
                    style={styles.earnedIcon}
                  />
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ChallengeCard({
  challenge,
  difficultyColor,
  showJoin = false,
}: {
  challenge: Challenge;
  difficultyColor: Record<string, string>;
  showJoin?: boolean;
}) {
  return (
    <Card variant="elevated" style={challengeStyles.card}>
      <View style={challengeStyles.header}>
        <View style={[challengeStyles.icon, { backgroundColor: `${Colors.emerald[500]}20` }]}>
          <MaterialCommunityIcons name={challenge.icon as any} size={22} color={Colors.emerald[500]} />
        </View>
        <View style={challengeStyles.info}>
          <View style={challengeStyles.titleRow}>
            <Text variant="body" weight="semibold">
              {challenge.title}
            </Text>
            <Badge
              label={challenge.difficulty}
              variant={
                challenge.difficulty === 'easy'
                  ? 'success'
                  : challenge.difficulty === 'medium'
                  ? 'warning'
                  : 'error'
              }
            />
          </View>
          <Text variant="caption" color="muted">
            {challenge.description}
          </Text>
        </View>
      </View>

      {challenge.isActive && (
        <View style={challengeStyles.progress}>
          <View style={challengeStyles.progressHeader}>
            <Text variant="caption" color="muted">
              {challenge.progress}/{challenge.target} {challenge.targetUnit}
            </Text>
            <Text variant="caption" color="muted">
              {challenge.daysLeft} days left
            </Text>
          </View>
          <ProgressBar
            progress={challenge.progress / challenge.target}
            color={Colors.emerald[500]}
            height={5}
          />
        </View>
      )}

      <View style={challengeStyles.footer}>
        <View style={challengeStyles.reward}>
          <MaterialCommunityIcons name="star" size={14} color={Colors.warning} />
          <Text variant="caption" style={{ color: Colors.warning }}>
            {challenge.rewardPoints} pts
          </Text>
        </View>
        {showJoin && (
          <TouchableOpacity style={challengeStyles.joinButton}>
            <Text variant="caption" color="secondary" weight="semibold">
              Start Challenge
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </Card>
  );
}

const challengeStyles = StyleSheet.create({
  card: {
    gap: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 3,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progress: {
    gap: Spacing.xs,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    paddingTop: Spacing.sm,
  },
  reward: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  joinButton: {
    backgroundColor: `${Colors.emerald[500]}15`,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: `${Colors.emerald[500]}40`,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
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
  streakValue: {
    color: Colors.warning,
    fontSize: FontSize.md,
    fontWeight: '700',
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
  section: {
    gap: Spacing.md,
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  badgeCard: {
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
  badgeCardLocked: {
    opacity: 0.5,
    borderColor: Colors.border,
  },
  badgeIcon: {
    fontSize: 36,
  },
  lockedText: {
    color: Colors.text.dim,
  },
  badgeDescription: {
    textAlign: 'center',
    lineHeight: 16,
  },
  earnedIcon: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
  },
});
