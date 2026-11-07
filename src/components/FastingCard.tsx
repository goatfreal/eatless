import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, FONTS } from '../theme/colors';
import { FastingProtocol, FastingTracker } from '../types/nutrition';

interface FastingCardProps {
  tracker: FastingTracker;
  onUpdateTracker: (next: FastingTracker) => void;
  expanded?: boolean;
}

const PROTOCOLS: { key: FastingProtocol; hours: number; desc: string }[] = [
  { key: '14:10', hours: 14, desc: '14 sa açlık · 10 sa beslenme' },
  { key: '16:8', hours: 16, desc: '16 sa açlık · 8 sa beslenme (Klasik Leangains)' },
  { key: '18:6', hours: 18, desc: '18 sa açlık · 6 sa beslenme (Otofaji Odaklı)' },
  { key: '20:4', hours: 20, desc: '20 sa açlık · 4 sa beslenme (Savaşçı Diyeti)' },
];

export const FastingCard: React.FC<FastingCardProps> = ({
  tracker,
  onUpdateTracker,
  expanded = false,
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!tracker.isFasting || !tracker.startTime) {
      setElapsedSeconds(0);
      return;
    }

    const updateTimer = () => {
      const startMs = new Date(tracker.startTime!).getTime();
      const diffSec = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
      setElapsedSeconds(diffSec);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [tracker.isFasting, tracker.startTime]);

  const targetSeconds = tracker.targetHours * 3600;
  const progress = Math.min(elapsedSeconds / Math.max(targetSeconds, 1), 1);
  const pct = Math.round(progress * 100);

  const hrs = Math.floor(elapsedSeconds / 3600);
  const mins = Math.floor((elapsedSeconds % 3600) / 60);
  const secs = elapsedSeconds % 60;
  const formattedTime = `${String(hrs).padStart(2, '0')}:${String(mins).padStart(
    2,
    '0'
  )}:${String(secs).padStart(2, '0')}`;

  const getMetabolicStage = (hoursElapsed: number): string => {
    if (!tracker.isFasting) return 'Beslenme Penceresi Aktif';
    if (hoursElapsed < 4) return 'Sindirim ve Glikoz Dengelenmesi (0-4 Saat)';
    if (hoursElapsed < 12) return 'Glikojen Rezervi Kullanımı (4-12 Saat)';
    if (hoursElapsed < 16) return 'Lipoliz ve Yağ Yakım Evresi (12-16 Saat)';
    return 'Hücresel Otofaji ve Derin Ketozis (16+ Saat)';
  };

  const handleProtocolChange = (proto: { key: FastingProtocol; hours: number }) => {
    onUpdateTracker({
      ...tracker,
      protocol: proto.key,
      targetHours: proto.hours,
    });
  };

  const handleToggleFasting = () => {
    if (tracker.isFasting) {
      const completed = elapsedSeconds >= 3600 ? tracker.completedFastsCount + 1 : tracker.completedFastsCount;
      onUpdateTracker({
        ...tracker,
        isFasting: false,
        startTime: null,
        completedFastsCount: completed,
      });
    } else {
      onUpdateTracker({
        ...tracker,
        isFasting: true,
        startTime: new Date().toISOString(),
      });
    }
  };

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>04. Aralıklı Oruç Protokolü</Text>
        <Text style={styles.sectionMeta}>
          Protokol {tracker.protocol} · {tracker.completedFastsCount} tamamlanan
        </Text>
      </View>

      {/* Single-elevation container (Outer r=10, inner segmented controls r=6) */}
      <View style={styles.container}>
        {/* Protocol Segmented Control */}
        <View style={styles.segmentBar}>
          {PROTOCOLS.map((p) => {
            const active = tracker.protocol === p.key;
            return (
              <TouchableOpacity
                key={p.key}
                onPress={() => handleProtocolChange(p)}
                activeOpacity={0.75}
                style={[styles.segmentBtn, active && styles.segmentBtnActive]}
              >
                <Text
                  style={[
                    styles.segmentBtnText,
                    active && styles.segmentBtnTextActive,
                  ]}
                >
                  {p.key}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.timerBlock}>
          <View style={styles.timerMetaRow}>
            <Text style={styles.stageText}>{getMetabolicStage(hrs)}</Text>
            <Text style={styles.pctText}>
              Hedef {tracker.targetHours} sa · %{pct}
            </Text>
          </View>

          <Text style={styles.timerValue}>{formattedTime}</Text>

          <View style={styles.track}>
            <View
              style={[
                styles.fill,
                {
                  width: `${pct}%`,
                  backgroundColor: tracker.isFasting ? COLORS.accent : COLORS.borderStrong,
                },
              ]}
            />
          </View>

          <TouchableOpacity
            onPress={handleToggleFasting}
            activeOpacity={0.8}
            style={[
              styles.actionBtn,
              tracker.isFasting ? styles.stopBtn : styles.startBtn,
            ]}
          >
            <Text style={styles.actionBtnText}>
              {tracker.isFasting ? 'Orucu Bitir' : 'Orucu Başlat'}
            </Text>
          </TouchableOpacity>
        </View>

        {expanded && (
          <View style={styles.stagesBlock}>
            <Text style={styles.stagesHeader}>Fizyolojik Oruç Evreleri</Text>
            {PROTOCOLS.map((p) => (
              <View key={p.key} style={styles.stageRow}>
                <Text style={styles.stageCode}>{p.key}</Text>
                <Text style={styles.stageDesc}>{p.desc}</Text>
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
  segmentBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceMuted,
    margin: 12,
    padding: 4,
    borderRadius: 8,
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 5,
    alignItems: 'center',
  },
  segmentBtnActive: {
    backgroundColor: COLORS.surface,
  },
  segmentBtnText: {
    fontFamily: FONTS.monoMedium,
    fontSize: 12,
    color: COLORS.inkMuted,
    fontVariant: ['tabular-nums'],
  },
  segmentBtnTextActive: {
    fontFamily: FONTS.monoSemiBold,
    color: COLORS.ink,
  },
  timerBlock: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 4,
  },
  timerMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 6,
  },
  stageText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 12,
    color: COLORS.inkSecondary,
    flex: 1,
    marginRight: 8,
  },
  pctText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.inkMuted,
    fontVariant: ['tabular-nums'],
  },
  timerValue: {
    fontFamily: FONTS.monoSemiBold,
    fontSize: 36,
    color: COLORS.ink,
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
    marginBottom: 12,
  },
  track: {
    height: 5,
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 14,
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
  actionBtn: {
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  startBtn: {
    backgroundColor: COLORS.accent,
  },
  stopBtn: {
    backgroundColor: COLORS.terracotta,
  },
  actionBtnText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
    color: COLORS.surface,
  },
  stagesBlock: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    padding: 16,
  },
  stagesHeader: {
    fontFamily: FONTS.display,
    fontSize: 13,
    color: COLORS.ink,
    marginBottom: 8,
  },
  stageRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceMuted,
  },
  stageCode: {
    fontFamily: FONTS.monoSemiBold,
    fontSize: 12,
    color: COLORS.ink,
    width: 52,
    fontVariant: ['tabular-nums'],
  },
  stageDesc: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.inkSecondary,
    flex: 1,
  },
});
