import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, FONTS } from '../theme/colors';
import { DailyTargets } from '../types/nutrition';

interface DailyCalorieCardProps {
  consumedCalories: number;
  consumedProtein: number;
  consumedCarbs: number;
  consumedFat: number;
  targets: DailyTargets;
}

export const DailyCalorieCard: React.FC<DailyCalorieCardProps> = ({
  consumedCalories,
  consumedProtein,
  consumedCarbs,
  consumedFat,
  targets,
}) => {
  const remaining = targets.calories - consumedCalories;
  const isOver = remaining < 0;
  const progressRatio = Math.min(consumedCalories / Math.max(targets.calories, 1), 1);

  const macros = [
    {
      label: 'Protein',
      consumed: consumedProtein,
      target: targets.protein,
      color: COLORS.accent,
    },
    {
      label: 'Karbonhidrat',
      consumed: consumedCarbs,
      target: targets.carbs,
      color: COLORS.ink,
    },
    {
      label: 'Yağ',
      consumed: consumedFat,
      target: targets.fat,
      color: COLORS.terracotta,
    },
  ];

  return (
    <View style={styles.section}>
      {/* Editorial Section Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>01. Günlük Enerji Bilançosu</Text>
        <Text style={styles.sectionMeta}>
          TDEE {targets.tdee} kcal · BMR {targets.bmr} kcal
        </Text>
      </View>

      {/* Single-Elevation Container (No nested cards, 1px hairline border) */}
      <View style={styles.container}>
        <View style={styles.heroBlock}>
          <View style={styles.heroHeaderRow}>
            <Text style={styles.heroLabel}>
              {isOver ? 'Hedef Aşımı' : 'Kalan Kalori Bütçesi'}
            </Text>
            <Text style={styles.inlineEquation}>
              Hedef {targets.calories} · Alınan {consumedCalories} kcal
            </Text>
          </View>

          <View style={styles.heroNumberRow}>
            <Text
              style={[
                styles.heroValue,
                isOver && { color: COLORS.terracotta },
              ]}
            >
              {Math.abs(remaining)}
            </Text>
            <Text style={styles.heroUnit}>kcal</Text>
          </View>

          {/* Clean Hairline Progress Track */}
          <View style={styles.mainTrack}>
            <View
              style={[
                styles.mainFill,
                {
                  width: `${Math.round(progressRatio * 100)}%`,
                  backgroundColor: isOver ? COLORS.terracotta : COLORS.accent,
                },
              ]}
            />
          </View>
        </View>

        {/* Hairline Divided Macro Rows (No cards inside cards) */}
        {macros.map((macro) => {
          const ratio = Math.min(macro.consumed / Math.max(macro.target, 1), 1);
          const pct = Math.round(ratio * 100);
          return (
            <View key={macro.label} style={styles.macroRow}>
              <View style={styles.macroRowTop}>
                <Text style={styles.macroName}>{macro.label}</Text>
                <Text style={styles.macroNumbers}>
                  {macro.consumed} / {macro.target} g · %{pct}
                </Text>
              </View>
              <View style={styles.macroTrack}>
                <View
                  style={[
                    styles.macroFill,
                    {
                      width: `${pct}%`,
                      backgroundColor: macro.color,
                    },
                  ]}
                />
              </View>
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
    marginTop: 18,
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
  heroBlock: {
    padding: 18,
  },
  heroHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 6,
  },
  heroLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.inkSecondary,
  },
  inlineEquation: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.inkMuted,
    fontVariant: ['tabular-nums'],
  },
  heroNumberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 14,
  },
  heroValue: {
    fontFamily: FONTS.monoSemiBold,
    fontSize: 42,
    lineHeight: 48,
    color: COLORS.ink,
    letterSpacing: -1.2,
    fontVariant: ['tabular-nums'],
  },
  heroUnit: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 15,
    color: COLORS.inkMuted,
  },
  mainTrack: {
    height: 6,
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: 3,
    overflow: 'hidden',
  },
  mainFill: {
    height: '100%',
    borderRadius: 3,
  },
  macroRow: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  macroRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 6,
  },
  macroName: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.ink,
  },
  macroNumbers: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.inkSecondary,
    fontVariant: ['tabular-nums'],
  },
  macroTrack: {
    height: 4,
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: 2,
    overflow: 'hidden',
  },
  macroFill: {
    height: '100%',
    borderRadius: 2,
  },
});
