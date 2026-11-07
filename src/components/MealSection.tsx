import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { FoodItem, MealType } from '../types/nutrition';

interface MealSectionProps {
  meals: FoodItem[];
  onAddMeal: (mealType: MealType) => void;
  onDeleteFood: (foodId: string) => void;
}

const SECTIONS: { type: MealType; title: string; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
  { type: 'breakfast', title: 'Kahvaltı', icon: 'sunny-outline', color: '#F59E0B' },
  { type: 'lunch', title: 'Öğle Yemeği', icon: 'restaurant-outline', color: '#10B981' },
  { type: 'dinner', title: 'Akşam Yemeği', icon: 'moon-outline', color: '#6366F1' },
  { type: 'snack', title: 'Atıştırmalık', icon: 'nutrition-outline', color: '#EC4899' },
];

export const MealSection: React.FC<MealSectionProps> = ({
  meals,
  onAddMeal,
  onDeleteFood,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionHeader}>Öğünler</Text>

      {SECTIONS.map((sec) => {
        const sectionMeals = meals.filter((m) => m.mealType === sec.type);
        const sectionCalories = sectionMeals.reduce((sum, item) => sum + item.calories, 0);

        return (
          <View key={sec.type} style={styles.mealCard}>
            {/* Meal Header */}
            <View style={styles.headerRow}>
              <View style={styles.titleGroup}>
                <View style={[styles.iconCircle, { backgroundColor: sec.color + '20' }]}>
                  <Ionicons name={sec.icon} size={18} color={sec.color} />
                </View>
                <View>
                  <Text style={styles.mealTitle}>{sec.title}</Text>
                  <Text style={styles.mealKcal}>
                    {sectionCalories > 0 ? `${sectionCalories} kcal` : 'Henüz kaydedilmedi'}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => onAddMeal(sec.type)}
                activeOpacity={0.7}
              >
                <Ionicons name="sparkles" size={14} color={COLORS.primary} />
                <Text style={styles.addBtnText}>+ Ekle</Text>
              </TouchableOpacity>
            </View>

            {/* List of food items */}
            {sectionMeals.length > 0 && (
              <View style={styles.itemsList}>
                {sectionMeals.map((item) => (
                  <View key={item.id} style={styles.foodRow}>
                    <View style={styles.foodMain}>
                      <Text style={styles.foodName}>{item.name}</Text>
                      <Text style={styles.foodMacros}>
                        {item.portion} • P: {item.protein}g • K: {item.carbs}g • Y: {item.fat}g
                      </Text>
                      {item.aiTip ? (
                        <View style={styles.aiTipRow}>
                          <Ionicons name="bulb-outline" size={11} color={COLORS.primaryLight} />
                          <Text style={styles.aiTipText}>{item.aiTip}</Text>
                        </View>
                      ) : null}
                    </View>

                    <View style={styles.foodRight}>
                      <Text style={styles.foodCal}>{item.calories} kcal</Text>
                      <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => onDeleteFood(item.id)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="trash-outline" size={15} color={COLORS.textMuted} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 12,
  },
  mealCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mealTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  mealKcal: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.cardSecondary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  addBtnText: {
    color: COLORS.primaryLight,
    fontSize: 12,
    fontWeight: '700',
  },
  itemsList: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder + '60',
    gap: 10,
  },
  foodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: COLORS.cardSecondary + '60',
    padding: 10,
    borderRadius: 12,
  },
  foodMain: {
    flex: 1,
    marginRight: 10,
  },
  foodName: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  foodMacros: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 3,
  },
  aiTipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    backgroundColor: COLORS.primaryGlow,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  aiTipText: {
    color: COLORS.primaryLight,
    fontSize: 10,
    fontWeight: '600',
  },
  foodRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  foodCal: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
  },
  deleteBtn: {
    padding: 2,
  },
});
