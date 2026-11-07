import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS, FONTS } from '../theme/colors';
import { WeightEntry } from '../types/nutrition';
import { calculateBMI } from '../utils/calorieCalculator';

interface WeightCardProps {
  currentWeightKg: number;
  targetWeightKg: number;
  heightCm: number;
  history: WeightEntry[];
  onLogWeight: (weightKg: number) => void;
}

export const WeightCard: React.FC<WeightCardProps> = ({
  currentWeightKg,
  targetWeightKg,
  heightCm,
  history,
  onLogWeight,
}) => {
  const [inputVal, setInputVal] = useState('');
  const { bmi, category } = calculateBMI(currentWeightKg, heightCm);
  const diff = +(currentWeightKg - targetWeightKg).toFixed(1);

  const handleSave = () => {
    const parsed = parseFloat(inputVal.replace(',', '.'));
    if (!isNaN(parsed) && parsed >= 30 && parsed <= 250) {
      onLogWeight(parsed);
      setInputVal('');
    }
  };

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>05. Vücut Ölçüleri ve VKİ</Text>
        <Text style={styles.sectionMeta}>
          VKİ {bmi} · {category}
        </Text>
      </View>

      <View style={styles.container}>
        <View style={styles.summaryBlock}>
          <View style={styles.metricCol}>
            <Text style={styles.metricLabel}>Güncel Ağırlık</Text>
            <Text style={styles.metricValue}>{currentWeightKg} kg</Text>
          </View>

          <View style={styles.metricCol}>
            <Text style={styles.metricLabel}>Hedef Ağırlık</Text>
            <Text style={styles.metricValue}>{targetWeightKg} kg</Text>
          </View>

          <View style={styles.metricCol}>
            <Text style={styles.metricLabel}>Kalan Fark</Text>
            <Text style={styles.metricValue}>
              {diff > 0 ? `-${diff}` : diff < 0 ? `+${Math.abs(diff)}` : '0'} kg
            </Text>
          </View>
        </View>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Yeni tartım girin (örn: 74.4)"
            placeholderTextColor={COLORS.inkMuted}
            keyboardType="decimal-pad"
            value={inputVal}
            onChangeText={setInputVal}
          />
          <TouchableOpacity
            onPress={handleSave}
            activeOpacity={0.75}
            style={styles.saveBtn}
          >
            <Text style={styles.saveBtnText}>Kaydet</Text>
          </TouchableOpacity>
        </View>

        {history.length > 0 && (
          <View style={styles.historyBlock}>
            <Text style={styles.historyTitle}>Son Tartım Kayıtları</Text>
            {history.slice(0, 4).map((entry) => (
              <View key={entry.id} style={styles.historyRow}>
                <Text style={styles.historyDate}>{entry.date}</Text>
                <Text style={styles.historyVal}>{entry.weightKg} kg</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginHorizontal: 16,
    marginTop: 22,
    marginBottom: 28,
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
  summaryBlock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  metricCol: {
    flex: 1,
  },
  metricLabel: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.inkMuted,
    marginBottom: 4,
  },
  metricValue: {
    fontFamily: FONTS.monoSemiBold,
    fontSize: 18,
    color: COLORS.ink,
    fontVariant: ['tabular-nums'],
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 8,
  },
  input: {
    flex: 1,
    height: 38,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    borderRadius: 6,
    paddingHorizontal: 12,
    fontFamily: FONTS.mono,
    fontSize: 13,
    color: COLORS.ink,
  },
  saveBtn: {
    height: 38,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: COLORS.ink,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 12,
    color: COLORS.surface,
  },
  historyBlock: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  historyTitle: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 11,
    color: COLORS.inkMuted,
    marginBottom: 6,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  historyDate: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.inkSecondary,
    fontVariant: ['tabular-nums'],
  },
  historyVal: {
    fontFamily: FONTS.monoSemiBold,
    fontSize: 11,
    color: COLORS.ink,
    fontVariant: ['tabular-nums'],
  },
});
