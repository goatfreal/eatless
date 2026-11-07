import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { DailyTargets, FoodItem } from '../types/nutrition';

interface DailyCalorieCardProps {
  targets: DailyTargets;
  meals: FoodItem[];
}

export const DailyCalorieCard: React.FC<DailyCalorieCardProps> = ({
  targets,
  meals,
}) => {
  // Sum up today's nutrition
  const consumed = meals.reduce(
    (acc, m) => {
      acc.calories += m.calories;
      acc.protein += m.protein;
      acc.carbs += m.carbs;
      acc.fat += m.fat;
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const remainingCalories = Math.max(0, targets.calories - consumed.calories);
  const caloriePercent = Math.min(100, Math.round((consumed.calories / targets.calories) * 100));

  const proteinPercent = Math.min(100, Math.round((consumed.protein / targets.protein) * 100));
  const carbsPercent = Math.min(100, Math.round((consumed.carbs / targets.carbs) * 100));
  const fatPercent = Math.min(100, Math.round((consumed.fat / targets.fat) * 100));

  return (
    <View style={styles.card}>
      {/* Top Calorie Summary */}
      <View style={styles.topRow}>
        <View style={styles.calorieCol}>
          <Text style={styles.calorieNumber}>{remainingCalories}</Text>
          <Text style={styles.calorieLabel}>Kalan Kalori (kcal)</Text>
        </View>

        <View style={styles.targetCol}>
          <View style={styles.targetItem}>
            <Ionicons name="flag-outline" size={14} color={COLORS.textSecondary} />
            <Text style={styles.targetItemText}>Hedef: {targets.calories}</Text>
          </View>
          <View style={styles.targetItem}>
            <Ionicons name="restaurant-outline" size={14} color={COLORS.primary} />
            <Text style={[styles.targetItemText, { color: COLORS.primaryLight }]}>
              Alınan: {consumed.calories}
            </Text>
          </View>
        </View>
      </View>

      {/* Main Calorie Progress Bar */}
      <View style={styles.calorieBarTrack}>
        <View
          style={[
            styles.calorieBarFill,
            { width: `${caloriePercent}%` },
            caloriePercent >= 100 && { backgroundColor: COLORS.danger },
          ]}
        />
      </View>

      {/* Macro Breakdown Rows (Protein, Carbs, Fat) */}
      <View style={styles.macrosContainer}>
        {/* Protein */}
        <View style={styles.macroBox}>
          <View style={styles.macroHeader}>
            <Text style={[styles.macroName, { color: COLORS.protein }]}>Protein</Text>
            <Text style={styles.macroValue}>
              {consumed.protein} / {targets.protein}g
            </Text>
          </View>
          <View style={styles.macroTrack}>
            <View
              style={[
                styles.macroFill,
                { width: `${proteinPercent}%`, backgroundColor: COLORS.protein },
              ]}
            />
          </View>
        </View>

        {/* Carbs */}
        <View style={styles.macroBox}>
          <View style={styles.macroHeader}>
            <Text style={[styles.macroName, { color: COLORS.carbs }]}>Karbonhidrat</Text>
            <Text style={styles.macroValue}>
              {consumed.carbs} / {targets.carbs}g
            </Text>
          </View>
          <View style={styles.macroTrack}>
            <View
              style={[
                styles.macroFill,
                { width: `${carbsPercent}%`, backgroundColor: COLORS.carbs },
              ]}
            />
          </View>
        </View>

        {/* Fat */}
        <View style={styles.macroBox}>
          <View style={styles.macroHeader}>
            <Text style={[styles.macroName, { color: COLORS.fat }]}>Yağ</Text>
            <Text style={styles.macroValue}>
              {consumed.fat} / {targets.fat}g
            </Text>
          </View>
          <View style={styles.macroTrack}>
            <View
              style={[
                styles.macroFill,
                { width: `${fatPercent}%`, backgroundColor: COLORS.fat },
              ]}
            />
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    marginHorizontal: 20,
    marginTop: 8,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calorieCol: {
    flex: 1,
  },
  calorieNumber: {
    fontSize: 40,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: -1,
  },
  calorieLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  targetCol: {
    alignItems: 'flex-end',
    gap: 6,
  },
  targetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.cardSecondary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  targetItemText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  calorieBarTrack: {
    height: 10,
    backgroundColor: COLORS.cardSecondary,
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 20,
  },
  calorieBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 5,
  },
  macrosContainer: {
    gap: 12,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder + '60',
  },
  macroBox: {
    gap: 5,
  },
  macroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  macroName: {
    fontSize: 12,
    fontWeight: '700',
  },
  macroValue: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  macroTrack: {
    height: 6,
    backgroundColor: COLORS.cardSecondary,
    borderRadius: 3,
    overflow: 'hidden',
  },
  macroFill: {
    height: '100%',
    borderRadius: 3,
  },
});
