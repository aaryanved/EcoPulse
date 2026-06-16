import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ActivityCard } from '@/components/carbon/ActivityCard';
import { useCarbon } from '@/hooks/useCarbon';
import { useClimatiqEstimate } from '@/hooks/useClimatiqEstimate';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { getCategoryColor, getCategoryIcon, getCategoryLabel } from '@/utils/carbon';
import { SUBCATEGORIES, type Subcategory } from '@/constants/activityFactors';
import { Colors, Spacing, BorderRadius, FontSize } from '@/constants/theme';
import type { ActivityCategory } from '@/types';

type LogStep = 'category' | 'details';

const CATEGORIES: ActivityCategory[] = ['transport', 'food', 'electricity', 'purchases', 'waste', 'other'];

export default function LogScreen() {
  const { activities, log, remove, isLoading } = useCarbon();
  const { isDesktop } = useBreakpoint();
  const [step, setStep] = useState<LogStep>('category');
  const [selectedCategory, setSelectedCategory] = useState<ActivityCategory | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<Subcategory | null>(null);
  const [quantity, setQuantity] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const parsedQty = parseFloat(quantity);
  const validQty = !isNaN(parsedQty) && parsedQty > 0 ? parsedQty : 0;

  const estimate = useClimatiqEstimate(selectedSubcategory?.id ?? null, validQty);

  function selectCategory(category: ActivityCategory) {
    setSelectedCategory(category);
    setSelectedSubcategory(null);
    setQuantity('');
    setDescription('');
    setStep('details');
  }

  function handleBack() {
    setStep('category');
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setQuantity('');
    setDescription('');
  }

  async function handleSave() {
    if (!selectedCategory || !selectedSubcategory || !quantity) return;

    if (isNaN(parsedQty) || parsedQty <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid quantity.');
      return;
    }

    const carbonKg = estimate.carbonKg;
    const desc = description || `${selectedSubcategory.label}: ${parsedQty} ${selectedSubcategory.unit}`;

    setIsSaving(true);
    try {
      await log(
        selectedCategory,
        selectedSubcategory.label,
        desc,
        carbonKg,
        {
          quantity: parsedQty,
          unit: selectedSubcategory.unit,
          subcategory_id: selectedSubcategory.id,
          estimate_source: estimate.source,
          factor_name: estimate.factorName ?? undefined,
        }
      );
      setStep('category');
      setSelectedCategory(null);
      setSelectedSubcategory(null);
      setQuantity('');
      setDescription('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to log activity';
      Alert.alert('Error', message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBack}
          style={[styles.backButton, step !== 'details' && styles.invisible]}
          disabled={step !== 'details'}
          accessibilityRole="button"
          accessibilityLabel="Go back to categories"
          accessibilityElementsHidden={step !== 'details'}
        >
          <MaterialCommunityIcons name="arrow-left" size={22} color={Colors.text.secondary} accessible={false} />
        </TouchableOpacity>
        <Text variant="title" style={styles.headerTitle}>Log Activity</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, isDesktop && styles.scrollContentDesktop]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {step === 'category' && (
          <>
            <Text variant="body" color="muted" style={styles.stepHint}>
              What did you do? Select a category to get started.
            </Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map(cat => {
                const color = getCategoryColor(cat);
                const icon = getCategoryIcon(cat);
                return (
                  <TouchableOpacity
                    key={cat}
                    style={styles.categoryCard}
                    onPress={() => selectCategory(cat)}
                    accessibilityRole="button"
                    accessibilityLabel={`Log ${getCategoryLabel(cat)} activity`}
                  >
                    <View style={[styles.categoryIcon, { backgroundColor: `${color}20` }]} accessible={false}>
                      <MaterialCommunityIcons name={icon as any} size={28} color={color} accessible={false} />
                    </View>
                    <Text variant="body" weight="medium" style={styles.categoryLabel} accessible={false}>
                      {getCategoryLabel(cat)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {activities.length > 0 && (
              <View style={styles.recentSection}>
                <Text variant="title" style={styles.recentTitle}>
                  Today's Log
                </Text>
                <View style={styles.activityList}>
                  {activities.slice(0, 10).map(activity => (
                    <ActivityCard key={activity.id} activity={activity} onDelete={remove} />
                  ))}
                </View>
              </View>
            )}
          </>
        )}

        {step === 'details' && selectedCategory && (
          <>
            <View style={styles.selectedCategoryHeader}>
              <View
                style={[
                  styles.categoryIconSmall,
                  { backgroundColor: `${getCategoryColor(selectedCategory)}20` },
                ]}
              >
                <MaterialCommunityIcons
                  name={getCategoryIcon(selectedCategory) as any}
                  size={20}
                  color={getCategoryColor(selectedCategory)}
                />
              </View>
              <Text variant="title">{getCategoryLabel(selectedCategory)}</Text>
            </View>

            <View style={styles.subcategoryList}>
              <Text variant="label" color="muted" style={styles.subLabel}>
                Activity Type
              </Text>
              {SUBCATEGORIES[selectedCategory].map(sub => (
                <TouchableOpacity
                  key={sub.id}
                  style={[
                    styles.subcategoryItem,
                    selectedSubcategory?.id === sub.id && styles.subcategorySelected,
                  ]}
                  onPress={() => setSelectedSubcategory(sub)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selectedSubcategory?.id === sub.id }}
                  accessibilityLabel={`${sub.label}, per ${sub.unit}`}
                >
                  <Text
                    variant="body"
                    style={selectedSubcategory?.id === sub.id ? styles.subcategoryTextSelected : undefined}
                    accessible={false}
                  >
                    {sub.label}
                  </Text>
                  <Text variant="caption" color="muted" accessible={false}>
                    per {sub.unit}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {selectedSubcategory && (
              <Card variant="elevated" style={styles.quantityCard}>
                <Text variant="label" color="muted" style={styles.subLabel}>
                  How much?
                </Text>
                <View style={styles.quantityRow}>
                  <TextInput
                    style={styles.quantityInput}
                    value={quantity}
                    onChangeText={setQuantity}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor={Colors.text.dim}
                    selectTextOnFocus
                    accessibilityLabel={`Quantity in ${selectedSubcategory?.unit ?? 'units'}`}
                  />
                  <Text variant="body" color="secondary" style={styles.unitLabel}>
                    {selectedSubcategory.unit}
                  </Text>
                </View>

                {validQty > 0 && (
                  <View style={styles.estimateRow}>
                    <MaterialCommunityIcons name="leaf" size={16} color={Colors.emerald[500]} />
                    <Text variant="body" style={styles.estimateValue}>
                      ≈ {estimate.carbonKg.toFixed(2)} kg CO₂e
                    </Text>
                    {estimate.isLoading ? (
                      <View style={styles.sourceTag}>
                        <ActivityIndicator size="small" color={Colors.text.muted} />
                        <Text variant="caption" color="muted">live...</Text>
                      </View>
                    ) : estimate.source === 'climatiq' ? (
                      <View style={styles.sourceTagApi}>
                        <View style={styles.sourceDot} />
                        <Text variant="caption" style={styles.sourceTextApi}>Climatiq</Text>
                      </View>
                    ) : (
                      <View style={styles.sourceTag}>
                        <Text variant="caption" color="dim">local</Text>
                      </View>
                    )}
                  </View>
                )}

                {estimate.factorName && !estimate.isLoading && (
                  <Text variant="caption" color="muted" style={styles.factorName} numberOfLines={1}>
                    {estimate.factorName}
                  </Text>
                )}

                <TextInput
                  style={styles.descriptionInput}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Optional note..."
                  placeholderTextColor={Colors.text.dim}
                  multiline
                  maxLength={200}
                  accessibilityLabel="Optional note for this activity"
                />

                <Button
                  onPress={handleSave}
                  loading={isSaving}
                  disabled={!quantity || parsedQty <= 0}
                  fullWidth
                  size="lg"
                  style={styles.saveButton}
                >
                  Save Activity
                </Button>
              </Card>
            )}
          </>
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
  },
  backButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -Spacing.xs,
  },
  invisible: {
    opacity: 0,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 38,
  },
  scrollContent: {
    paddingHorizontal: Spacing['2xl'],
    paddingBottom: Spacing['4xl'],
    gap: Spacing.xl,
  },
  scrollContentDesktop: { maxWidth: 760, alignSelf: 'center', width: '100%' },
  stepHint: {
    marginTop: -Spacing.sm,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  categoryCard: {
    width: '47%',
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryLabel: {
    textAlign: 'center',
  },
  recentSection: {
    gap: Spacing.md,
  },
  recentTitle: {},
  activityList: {
    gap: Spacing.sm,
  },
  selectedCategoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  categoryIconSmall: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subLabel: {
    marginBottom: Spacing.sm,
  },
  subcategoryList: {
    gap: Spacing.sm,
  },
  subcategoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  subcategorySelected: {
    borderColor: Colors.emerald[500],
    backgroundColor: `${Colors.emerald[500]}10`,
  },
  subcategoryTextSelected: {
    color: Colors.emerald[400],
    fontWeight: '600',
  },
  quantityCard: {
    gap: Spacing.md,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.emerald[700],
  },
  quantityInput: {
    flex: 1,
    fontSize: FontSize['3xl'],
    fontWeight: '700',
    color: Colors.text.primary,
    padding: 0,
  },
  unitLabel: {
    fontSize: FontSize.md,
  },
  estimateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: `${Colors.emerald[500]}10`,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
  },
  estimateValue: {
    color: Colors.emerald[400],
    fontWeight: '600',
    flex: 1,
  },
  sourceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.background.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  sourceTagApi: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${Colors.emerald[500]}20`,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  sourceDot: {
    width: 6,
    height: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.emerald[500],
  },
  sourceTextApi: {
    color: Colors.emerald[400],
    fontWeight: '600',
    fontSize: FontSize.xs,
  },
  factorName: {
    marginTop: -Spacing.xs,
    fontStyle: 'italic',
  },
  descriptionInput: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    color: Colors.text.primary,
    fontSize: FontSize.base,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 72,
    textAlignVertical: 'top',
  },
  saveButton: {
    marginTop: Spacing.sm,
  },
});
