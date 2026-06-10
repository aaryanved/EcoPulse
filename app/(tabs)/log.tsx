import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ActivityCard } from '@/components/carbon/ActivityCard';
import { useCarbon } from '@/hooks/useCarbon';
import { getCategoryColor, getCategoryIcon, getCategoryLabel } from '@/utils/carbon';
import { Colors, Spacing, BorderRadius, FontSize } from '@/constants/theme';
import type { ActivityCategory } from '@/types';

type LogStep = 'category' | 'details';

const CATEGORIES: ActivityCategory[] = ['transport', 'food', 'electricity', 'purchases', 'waste', 'other'];

interface TransportSubcategory {
  id: string;
  label: string;
  unit: string;
  kgPerUnit: number;
}

const SUBCATEGORIES: Record<ActivityCategory, TransportSubcategory[]> = {
  transport: [
    { id: 'car_petrol', label: 'Car (Petrol)', unit: 'km', kgPerUnit: 0.192 },
    { id: 'car_diesel', label: 'Car (Diesel)', unit: 'km', kgPerUnit: 0.171 },
    { id: 'car_electric', label: 'Electric Car', unit: 'km', kgPerUnit: 0.053 },
    { id: 'bus', label: 'Bus', unit: 'km', kgPerUnit: 0.089 },
    { id: 'train', label: 'Train', unit: 'km', kgPerUnit: 0.041 },
    { id: 'flight_short', label: 'Short Flight (<3h)', unit: 'flight', kgPerUnit: 255 },
    { id: 'flight_long', label: 'Long Flight (>3h)', unit: 'flight', kgPerUnit: 895 },
    { id: 'taxi', label: 'Taxi / Rideshare', unit: 'km', kgPerUnit: 0.149 },
  ],
  food: [
    { id: 'beef', label: 'Beef / Lamb', unit: 'kg', kgPerUnit: 27 },
    { id: 'chicken', label: 'Chicken / Pork', unit: 'kg', kgPerUnit: 5.7 },
    { id: 'fish', label: 'Fish / Seafood', unit: 'kg', kgPerUnit: 6.1 },
    { id: 'dairy', label: 'Dairy', unit: 'kg', kgPerUnit: 3.2 },
    { id: 'vegetables', label: 'Vegetables', unit: 'kg', kgPerUnit: 0.4 },
    { id: 'grains', label: 'Grains / Bread', unit: 'kg', kgPerUnit: 1.4 },
    { id: 'meal_restaurant', label: 'Restaurant Meal', unit: 'meal', kgPerUnit: 2.1 },
    { id: 'meal_takeout', label: 'Takeout / Delivery', unit: 'meal', kgPerUnit: 1.8 },
  ],
  electricity: [
    { id: 'home_electricity', label: 'Home Electricity', unit: 'kWh', kgPerUnit: 0.233 },
    { id: 'natural_gas', label: 'Natural Gas', unit: 'kWh', kgPerUnit: 0.203 },
    { id: 'heating_oil', label: 'Heating Oil', unit: 'litre', kgPerUnit: 2.68 },
  ],
  purchases: [
    { id: 'clothing', label: 'Clothing', unit: 'USD', kgPerUnit: 0.025 },
    { id: 'electronics', label: 'Electronics', unit: 'USD', kgPerUnit: 0.04 },
    { id: 'furniture', label: 'Furniture', unit: 'USD', kgPerUnit: 0.03 },
    { id: 'online_shopping', label: 'Online Shopping', unit: 'USD', kgPerUnit: 0.02 },
  ],
  waste: [
    { id: 'general_waste', label: 'General Waste', unit: 'kg', kgPerUnit: 0.57 },
    { id: 'recycling', label: 'Recycling (saved)', unit: 'kg', kgPerUnit: -0.15 },
    { id: 'compost', label: 'Composting (saved)', unit: 'kg', kgPerUnit: -0.2 },
  ],
  other: [
    { id: 'custom', label: 'Custom Entry', unit: 'kg CO₂', kgPerUnit: 1 },
  ],
};

export default function LogScreen() {
  const { activities, log, remove, isLoading } = useCarbon();
  const [step, setStep] = useState<LogStep>('category');
  const [selectedCategory, setSelectedCategory] = useState<ActivityCategory | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<TransportSubcategory | null>(null);
  const [quantity, setQuantity] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

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
  }

  async function handleSave() {
    if (!selectedCategory || !selectedSubcategory || !quantity) return;

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid quantity.');
      return;
    }

    const carbonKg = qty * selectedSubcategory.kgPerUnit;
    const desc = description || `${selectedSubcategory.label}: ${qty} ${selectedSubcategory.unit}`;

    setIsSaving(true);
    try {
      await log(
        selectedCategory,
        selectedSubcategory.label,
        desc,
        carbonKg,
        { quantity: qty, unit: selectedSubcategory.unit, subcategory_id: selectedSubcategory.id }
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

  const estimatedCarbon =
    selectedSubcategory && quantity && !isNaN(parseFloat(quantity))
      ? parseFloat(quantity) * selectedSubcategory.kgPerUnit
      : 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {step === 'details' && (
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={Colors.text.secondary} />
          </TouchableOpacity>
        )}
        <Text variant="title">Log Activity</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
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
                  >
                    <View style={[styles.categoryIcon, { backgroundColor: `${color}20` }]}>
                      <MaterialCommunityIcons name={icon as any} size={28} color={color} />
                    </View>
                    <Text variant="body" weight="medium" style={styles.categoryLabel}>
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
                  style={[styles.subcategoryItem, selectedSubcategory?.id === sub.id && styles.subcategorySelected]}
                  onPress={() => setSelectedSubcategory(sub)}
                >
                  <Text
                    variant="body"
                    style={selectedSubcategory?.id === sub.id ? styles.subcategoryTextSelected : undefined}
                  >
                    {sub.label}
                  </Text>
                  <Text variant="caption" color="muted">
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
                  />
                  <Text variant="body" color="secondary" style={styles.unitLabel}>
                    {selectedSubcategory.unit}
                  </Text>
                </View>

                {estimatedCarbon > 0 && (
                  <View style={styles.estimateRow}>
                    <MaterialCommunityIcons name="leaf" size={16} color={Colors.emerald[500]} />
                    <Text variant="body" style={{ color: Colors.emerald[400] }}>
                      ≈ {estimatedCarbon.toFixed(2)} kg CO₂e
                    </Text>
                  </View>
                )}

                <TextInput
                  style={styles.descriptionInput}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Optional note..."
                  placeholderTextColor={Colors.text.dim}
                  multiline
                  maxLength={200}
                />

                <Button
                  onPress={handleSave}
                  loading={isSaving}
                  disabled={!quantity || parseFloat(quantity) <= 0}
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
    gap: Spacing.md,
  },
  backButton: {
    padding: Spacing.xs,
    marginLeft: -Spacing.xs,
  },
  scrollContent: {
    paddingHorizontal: Spacing['2xl'],
    paddingBottom: Spacing['4xl'],
    gap: Spacing.xl,
  },
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
