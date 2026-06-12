import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { GoalCard } from '@/components/carbon/GoalCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { useGoals } from '@/hooks/useGoals';
import { useCarbon } from '@/hooks/useCarbon';
import type { ActivityCategory } from '@/types';
import { getCategoryLabel } from '@/utils/carbon';
import { Colors, Spacing, BorderRadius, FontSize } from '@/constants/theme';

type Period = 'weekly' | 'monthly' | 'yearly';
type Category = ActivityCategory | 'overall';

const CATEGORIES: Category[] = ['overall', 'transport', 'food', 'electricity', 'purchases', 'waste'];

const PERIOD_OPTIONS: Array<{ value: Period; label: string }> = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

export default function GoalsScreen() {
  const { goals, activeGoals, completedGoals, isLoading, refresh, createGoal } = useGoals();
  const { currentMonthBreakdown } = useCarbon();

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>('overall');
  const [targetKg, setTargetKg] = useState('');
  const [period, setPeriod] = useState<Period>('monthly');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleCreate() {
    if (!title.trim() || !targetKg || isNaN(parseFloat(targetKg))) {
      Alert.alert('Invalid', 'Please enter a goal title and a valid target.');
      return;
    }
    setIsSaving(true);
    try {
      await createGoal(title.trim(), category, parseFloat(targetKg), period);
      setShowForm(false);
      setTitle('');
      setTargetKg('');
      setCategory('overall');
      setPeriod('monthly');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create goal';
      Alert.alert('Error', msg);
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading && goals.length === 0) {
    return <LoadingSpinner fullScreen label="Loading goals..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={Colors.text.secondary} />
        </TouchableOpacity>
        <Text variant="title">Goals</Text>
        <TouchableOpacity onPress={() => setShowForm(v => !v)}>
          <MaterialCommunityIcons
            name={showForm ? 'close' : 'plus'}
            size={22}
            color={Colors.emerald[500]}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {showForm && (
          <Card variant="elevated" style={styles.form}>
            <Text variant="title" style={{ marginBottom: Spacing.base }}>New Goal</Text>

            <Text variant="label" color="muted" style={styles.formLabel}>Title</Text>
            <TextInput
              style={styles.textInput}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Reduce transport by 20kg"
              placeholderTextColor={Colors.text.dim}
              maxLength={60}
            />

            <Text variant="label" color="muted" style={styles.formLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.chip, category === cat && styles.chipActive]}
                  onPress={() => setCategory(cat)}
                >
                  <Text
                    variant="caption"
                    weight="semibold"
                    style={category === cat ? styles.chipTextActive : styles.chipText}
                  >
                    {cat === 'overall' ? 'Overall' : getCategoryLabel(cat)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text variant="label" color="muted" style={styles.formLabel}>Period</Text>
            <View style={styles.periodRow}>
              {PERIOD_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.periodBtn, period === opt.value && styles.periodBtnActive]}
                  onPress={() => setPeriod(opt.value)}
                >
                  <Text
                    variant="caption"
                    weight="semibold"
                    style={period === opt.value ? styles.chipTextActive : styles.chipText}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text variant="label" color="muted" style={styles.formLabel}>
              Target (kg CO₂)
            </Text>
            <TextInput
              style={styles.textInput}
              value={targetKg}
              onChangeText={setTargetKg}
              placeholder="e.g. 150"
              placeholderTextColor={Colors.text.dim}
              keyboardType="decimal-pad"
            />

            <View style={styles.formActions}>
              <Button variant="outline" onPress={() => setShowForm(false)} style={{ flex: 1 }}>
                Cancel
              </Button>
              <Button
                onPress={handleCreate}
                loading={isSaving}
                disabled={!title.trim() || !targetKg}
                style={{ flex: 2 }}
                size="lg"
              >
                Create Goal
              </Button>
            </View>
          </Card>
        )}

        {activeGoals.length === 0 && !showForm ? (
          <EmptyState
            icon="target"
            title="No active goals"
            description="Set a carbon reduction goal to track your progress."
            actionLabel="Create a Goal"
            onAction={() => setShowForm(true)}
          />
        ) : (
          <>
            {activeGoals.length > 0 && (
              <View style={styles.section}>
                <Text variant="title">Active Goals</Text>
                {activeGoals.map(goal => (
                  <GoalCard key={goal.id} goal={goal} />
                ))}
              </View>
            )}
            {completedGoals.length > 0 && (
              <View style={styles.section}>
                <Text variant="title">Completed</Text>
                {completedGoals.map(goal => (
                  <GoalCard key={goal.id} goal={goal} />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.base,
  },
  scrollContent: {
    paddingHorizontal: Spacing['2xl'],
    paddingBottom: Spacing['4xl'],
    gap: Spacing.xl,
  },
  form: { gap: Spacing.sm },
  formLabel: { marginTop: Spacing.sm, marginBottom: Spacing.xs },
  textInput: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    color: Colors.text.primary,
    fontSize: FontSize.base,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipRow: { marginBottom: Spacing.xs },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: Spacing.sm,
  },
  chipActive: { backgroundColor: Colors.emerald[500], borderColor: Colors.emerald[500] },
  chipText: { color: Colors.text.muted },
  chipTextActive: { color: Colors.background.primary },
  periodRow: { flexDirection: 'row', gap: Spacing.sm },
  periodBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  periodBtnActive: { backgroundColor: Colors.emerald[500], borderColor: Colors.emerald[500] },
  formActions: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.sm },
  section: { gap: Spacing.md },
});
