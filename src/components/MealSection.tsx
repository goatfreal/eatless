import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, FONTS } from '../theme/colors';
import { FoodItem, MealType } from '../types/nutrition';

interface MealSectionProps {
  meals: FoodItem[];
  onAddMeal: (mealType: MealType) => void;
  onDeleteMeal: (id: string) => void;
}

const MEAL_GROUPS: { type: MealType; title: string; targetPct: string }[] = [
  { type: 'breakfast', title: 'Kahvaltı', targetPct: 'Önerilen %25' },
  { type: 'lunch', title: 'Öğle Yemeği', targetPct: 'Önerilen %35' },
  { type: 'dinner', title: 'Akşam Yemeği', targetPct: 'Önerilen %30' },
  { type: 'snack', title: 'Ara Öğün', targetPct: 'Önerilen %10' },
];

export const MealSection: React.FC<MealSectionProps> = ({
  meals,
  onAddMeal,
  onDeleteMeal,
}) => {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>02. Öğün Kayıtları</Text>
        <Text style={styles.sectionMeta}>{meals.length} kayıt</Text>
      </View>

      {/* Single-elevation container with 1px hairline dividers */}
      <View style={styles.container}>
        {MEAL_GROUPS.map((group, idx) => {
          const groupItems = meals.filter((m) => m.mealType === group.type);
          const groupKcal = groupItems.reduce((sum, item) => sum + item.calories, 0);

          return (
            <View
              key={group.type}
              style={[styles.groupBlock, idx > 0 && styles.groupDivider]}
            >
              <View style={styles.groupHeader}>
                <View style={styles.groupTitleBlock}>
                  <Text style={styles.groupTitle}>{group.title}</Text>
                  <Text style={styles.groupSubtitle}>
                    {groupKcal > 0
                      ? `${groupKcal} kcal · ${groupItems.length} besin`
                      : group.targetPct}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => onAddMeal(group.type)}
                  activeOpacity={0.75}
                  style={styles.addBtn}
                >
                  <Text style={styles.addBtnText}>+ Ekle</Text>
                </TouchableOpacity>
              </View>

              {groupItems.length > 0 && (
                <View style={styles.itemsList}>
                  {groupItems.map((item) => (
                    <View key={item.id} style={styles.foodRow}>
                      <View style={styles.foodInfo}>
                        <Text style={styles.foodName}>{item.name}</Text>
                        {/* Zero-pill quiet inline metadata separated by middot and slash */}
                        <Text style={styles.foodMeta}>
                          {item.portion} · {item.calories} kcal · {item.protein}g P /{' '}
                          {item.carbs}g K / {item.fat}g Y
                        </Text>
                        {item.aiTip ? (
                          <Text style={styles.foodNote}>{item.aiTip}</Text>
                        ) : null}
                      </View>

                      <TouchableOpacity
                        onPress={() => onDeleteMeal(item.id)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        style={styles.deleteBtn}
                      >
                        <Text style={styles.deleteText}>Sil</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginHorizontal: 16,
    marginTop: 22,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  sectionTitle: {
    fontFamily: FONTS.displayBold,
    fontSize: 15,
    color: COLORS.ink,
    letterSpacing: -0.2,
  },
  sectionMeta: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.inkMuted,
    fontVariant: ['tabular-nums'],
  },
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  groupBlock: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  groupDivider: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  groupTitleBlock: {
    flex: 1,
    marginRight: 12,
  },
  groupTitle: {
    fontFamily: FONTS.display,
    fontSize: 15,
    color: COLORS.ink,
    marginBottom: 2,
  },
  groupSubtitle: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.inkMuted,
    fontVariant: ['tabular-nums'],
  },
  addBtn: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    backgroundColor: COLORS.background,
  },
  addBtnText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 12,
    color: COLORS.ink,
  },
  itemsList: {
    marginTop: 10,
  },
  foodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 10,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceMuted,
  },
  foodInfo: {
    flex: 1,
    marginRight: 12,
  },
  foodName: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
    color: COLORS.ink,
    marginBottom: 3,
  },
  foodMeta: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.inkSecondary,
    fontVariant: ['tabular-nums'],
  },
  foodNote: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.inkMuted,
    marginTop: 4,
    lineHeight: 16,
  },
  deleteBtn: {
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  deleteText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 11,
    color: COLORS.danger,
  },
});
