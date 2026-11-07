import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { FastingProtocol, FastingTracker } from '../types/nutrition';

interface FastingCardProps {
  fasting: FastingTracker;
  onToggleFasting: () => void;
  onChangeProtocol: (protocol: FastingProtocol, targetHours: number) => void;
}

const PROTOCOLS: { label: FastingProtocol; hours: number }[] = [
  { label: '14:10', hours: 14 },
  { label: '16:8', hours: 16 },
  { label: '18:6', hours: 18 },
  { label: '20:4', hours: 20 },
];

export const FastingCard: React.FC<FastingCardProps> = ({
  fasting,
  onToggleFasting,
  onChangeProtocol,
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    function calculate() {
      if (!fasting.isFasting || !fasting.startTime) {
        setElapsedSeconds(0);
        return;
      }
      const start = new Date(fasting.startTime).getTime();
      const now = Date.now();
      setElapsedSeconds(Math.max(0, Math.floor((now - start) / 1000)));
    }

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [fasting]);

  const hours = Math.floor(elapsedSeconds / 3600);
  const mins = Math.floor((elapsedSeconds % 3600) / 60);
  const secs = elapsedSeconds % 60;

  const targetTotalSeconds = (fasting.targetHours || 16) * 3600;
  const progressPercent = Math.min(100, Math.round((elapsedSeconds / targetTotalSeconds) * 100));

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.left}>
          <View style={styles.iconCircle}>
            <Ionicons name="timer-outline" size={20} color={COLORS.fasting} />
          </View>
          <View>
            <Text style={styles.title}>Aralıklı Oruç ({fasting.protocol || '16:8'})</Text>
            <Text style={styles.subtitle}>
              {fasting.isFasting
                ? `${hours}s ${mins}dk ${secs}sn geçti (%${progressPercent})`
                : 'Oruç aktif değil • Başlatmak için dokun'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.toggleBtn,
            fasting.isFasting ? styles.toggleBtnActive : styles.toggleBtnInactive,
          ]}
          onPress={onToggleFasting}
        >
          <Text style={styles.toggleBtnText}>
            {fasting.isFasting ? 'Orucu Bitir' : 'Başlat'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Protocol Selector */}
      <View style={styles.protocolRow}>
        {PROTOCOLS.map((p) => (
          <TouchableOpacity
            key={p.label}
            style={[
              styles.protocolChip,
              fasting.protocol === p.label && styles.protocolChipActive,
            ]}
            onPress={() => onChangeProtocol(p.label, p.hours)}
          >
            <Text
              style={[
                styles.protocolText,
                fasting.protocol === p.label && styles.protocolTextActive,
              ]}
            >
              {p.label} ({p.hours} Saat)
            </Text>
          </TouchableOpacity>
        ))}
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
    marginBottom: 16,
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
    flex: 1,
  },
  iconCircle: {
    width: 38,
    height: 38,
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
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  toggleBtnActive: {
    backgroundColor: '#8B5CF625',
    borderColor: COLORS.fasting,
  },
  toggleBtnInactive: {
    backgroundColor: COLORS.fasting,
    borderColor: COLORS.fasting,
  },
  toggleBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  protocolRow: {
    flexDirection: 'row',
    gap: 6,
  },
  protocolChip: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: COLORS.cardSecondary,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  protocolChipActive: {
    borderColor: COLORS.fasting,
    backgroundColor: '#8B5CF620',
  },
  protocolText: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  protocolTextActive: {
    color: '#C4B5FD',
    fontWeight: '800',
  },
  track: {
    height: 6,
    backgroundColor: COLORS.cardSecondary,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 12,
  },
  fill: {
    height: '100%',
    backgroundColor: COLORS.fasting,
    borderRadius: 3,
  },
});
