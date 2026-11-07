import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, FONTS } from '../theme/colors';

interface WaterCardProps {
  waterMl: number;
  targetMl: number;
  onUpdateWater: (deltaMl: number) => void;
}

export const WaterCard: React.FC<WaterCardProps> = ({
  waterMl,
  targetMl,
  onUpdateWater,
}) => {
  const safeTarget = Math.max(targetMl, 1500);
  const ratio = Math.min(waterMl / safeTarget, 1);
  const pct = Math.round(ratio * 100);
  const glasses = Math.round(waterMl / 250);

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>03. Hidrasyon Takibi</Text>
        <Text style={styles.sectionMeta}>
          {glasses} bardak · %{pct}
        </Text>
      </View>

      <View style={styles.container}>
        <View style={styles.topRow}>
          <View>
            <Text style={styles.label}>Günlük Su Tüketimi</Text>
            <View style={styles.valueRow}>
              <Text style={styles.value}>{waterMl}</Text>
              <Text style={styles.unit}>/ {safeTarget} ml</Text>
            </View>
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              onPress={() => onUpdateWater(-250)}
              activeOpacity={0.75}
              style={styles.secondaryBtn}
            >
              <Text style={styles.secondaryBtnText}>-250 ml</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => onUpdateWater(250)}
              activeOpacity={0.75}
              style={styles.primaryBtn}
            >
              <Text style={styles.primaryBtnText}>+250 ml</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => onUpdateWater(500)}
              activeOpacity={0.75}
              style={styles.secondaryBtn}
            >
              <Text style={styles.secondaryBtnText}>+500 ml</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.track}>
          <View style={[styles.fill, { width: `${pct}%` }]} />
        </View>
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
    padding: 16,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  label: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 12,
    color: COLORS.inkSecondary,
    marginBottom: 2,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  value: {
    fontFamily: FONTS.monoSemiBold,
    fontSize: 24,
    color: COLORS.ink,
    fontVariant: ['tabular-nums'],
  },
  unit: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    color: COLORS.inkMuted,
    fontVariant: ['tabular-nums'],
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  primaryBtn: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 6,
    backgroundColor: COLORS.ink,
  },
  primaryBtnText: {
    fontFamily: FONTS.monoMedium,
    fontSize: 12,
    color: COLORS.surface,
    fontVariant: ['tabular-nums'],
  },
  secondaryBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    backgroundColor: COLORS.background,
  },
  secondaryBtnText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.ink,
    fontVariant: ['tabular-nums'],
  },
  track: {
    height: 5,
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: COLORS.cobalt,
    borderRadius: 3,
  },
});
