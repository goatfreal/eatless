import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';

interface HeaderProps {
  onOpenSettings: () => void;
  hasNvidiaKey: boolean;
  selectedDate: string;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSettings,
  hasNvidiaKey,
  selectedDate,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.leftCol}>
        <View style={styles.brandRow}>
          <Text style={styles.appName}>Eatless</Text>
          <View style={[styles.aiPill, { borderColor: hasNvidiaKey ? COLORS.nvidia : '#475569' }]}>
            <Ionicons
              name="sparkles"
              size={12}
              color={hasNvidiaKey ? COLORS.nvidia : '#94A3B8'}
            />
            <Text style={[styles.aiPillText, { color: hasNvidiaKey ? COLORS.nvidia : '#94A3B8' }]}>
              {hasNvidiaKey ? 'NVIDIA AI' : 'Yerel AI'}
            </Text>
          </View>
        </View>
        <Text style={styles.dateText}>
          {new Date(selectedDate).toLocaleDateString('tr-TR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.settingsBtn}
        onPress={onOpenSettings}
        activeOpacity={0.7}
      >
        <Ionicons name="settings-sharp" size={20} color={COLORS.textSecondary} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 10,
  },
  leftCol: {
    gap: 3,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  appName: {
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  aiPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    backgroundColor: '#161A22',
    borderWidth: 1,
  },
  aiPillText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  dateText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
});
