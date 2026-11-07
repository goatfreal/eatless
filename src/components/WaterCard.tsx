import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';

interface WaterCardProps {
  currentMl: number;
  targetMl: number;
  onUpdateWater: (newMl: number) => void;
}

export const WaterCard: React.FC<WaterCardProps> = ({
  currentMl,
  targetMl,
  onUpdateWater,
}) => {
  const percent = Math.min(100, Math.round((currentMl / targetMl) * 100));

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.left}>
          <View style={styles.iconCircle}>
            <Ionicons name="water" size={18} color={COLORS.water} />
          </View>
          <View>
            <Text style={styles.title}>Su Takibi</Text>
            <Text style={styles.subtitle}>
              {currentMl} / {targetMl} ml (%{percent})
            </Text>
          </View>
        </View>

        <View style={styles.buttonsRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => onUpdateWater(Math.max(0, currentMl - 250))}
            activeOpacity={0.7}
          >
            <Ionicons name="remove" size={14} color={COLORS.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnAdd]}
            onPress={() => onUpdateWater(currentMl + 250)}
            activeOpacity={0.7}
          >
            <Text style={styles.btnText}>+250ml</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnAdd]}
            onPress={() => onUpdateWater(currentMl + 500)}
            activeOpacity={0.7}
          >
            <Text style={styles.btnText}>+500ml</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.track}>
        <View style={[styles.fill, { width: `${percent}%` }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    marginHorizontal: 20,
    marginTop: 14,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#06B6D415',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  buttonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionBtn: {
    backgroundColor: COLORS.cardSecondary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnAdd: {
    backgroundColor: '#06B6D420',
    borderColor: '#06B6D440',
  },
  btnText: {
    color: COLORS.water,
    fontSize: 11,
    fontWeight: '700',
  },
  track: {
    height: 6,
    backgroundColor: COLORS.cardSecondary,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: COLORS.water,
    borderRadius: 3,
  },
});
