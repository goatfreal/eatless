import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { FastingTracker } from '../types/nutrition';

interface FastingCardProps {
  fasting: FastingTracker;
  onToggleFasting: () => void;
}

export const FastingCard: React.FC<FastingCardProps> = ({
  fasting,
  onToggleFasting,
}) => {
  const [elapsedMinutes, setElapsedMinutes] = useState(0);

  useEffect(() => {
    function calculate() {
      if (!fasting.isFasting || !fasting.startTime) {
        setElapsedMinutes(0);
        return;
      }
      const start = new Date(fasting.startTime).getTime();
      const now = Date.now();
      const diff = Math.max(0, Math.floor((now - start) / 60000));
      setElapsedMinutes(diff);
    }

    calculate();
    const interval = setInterval(calculate, 60000);
    return () => clearInterval(interval);
  }, [fasting]);

  const hours = Math.floor(elapsedMinutes / 60);
  const mins = elapsedMinutes % 60;
  const targetTotalMinutes = fasting.targetHours * 60;
  const progressPercent = Math.min(100, Math.round((elapsedMinutes / targetTotalMinutes) * 100));

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.left}>
          <View style={styles.iconCircle}>
            <Ionicons name="timer-outline" size={18} color={COLORS.fasting} />
          </View>
          <View>
            <Text style={styles.title}>Aralıklı Oruç (16:8)</Text>
            <Text style={styles.subtitle}>
              {fasting.isFasting
                ? `${hours} sa ${mins} dk oruçtasınız (%${progressPercent})`
                : 'Şu an yeme penceresindesiniz'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.toggleBtn, fasting.isFasting ? styles.toggleBtnActive : styles.toggleBtnInactive]}
          onPress={onToggleFasting}
          activeOpacity={0.7}
        >
          <Text style={styles.toggleBtnText}>
            {fasting.isFasting ? 'Bitir' : 'Orucu Başlat'}
          </Text>
        </TouchableOpacity>
      </View>

      {fasting.isFasting && (
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${progressPercent}%` }]} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 20,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
    backgroundColor: '#8B5CF618',
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
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  toggleBtnActive: {
    backgroundColor: '#8B5CF620',
    borderColor: '#8B5CF650',
  },
  toggleBtnInactive: {
    backgroundColor: COLORS.cardSecondary,
    borderColor: COLORS.cardBorder,
  },
  toggleBtnText: {
    color: COLORS.fasting,
    fontSize: 12,
    fontWeight: '700',
  },
  track: {
    height: 6,
    backgroundColor: COLORS.cardSecondary,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 8,
  },
  fill: {
    height: '100%',
    backgroundColor: COLORS.fasting,
    borderRadius: 3,
  },
});
