import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';

interface HeaderProps {
  userName: string;
  hasNvidiaKey: boolean;
  selectedDate: string;
  onChangeDate: (offsetDays: number) => void;
  onOpenProfile: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  userName,
  hasNvidiaKey,
  selectedDate,
  onChangeDate,
  onOpenProfile,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const isToday = selectedDate === todayStr;

  const formattedDate = isToday
    ? 'Bugün'
    : new Date(selectedDate).toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'short',
        weekday: 'short',
      });

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.leftCol}>
          <View style={styles.brandRow}>
            <Text style={styles.greeting}>Merhaba, {userName}</Text>
            <TouchableOpacity
              style={[
                styles.aiPill,
                { borderColor: hasNvidiaKey ? COLORS.nvidia : COLORS.danger },
              ]}
              onPress={onOpenProfile}
            >
              <Ionicons
                name={hasNvidiaKey ? 'checkmark-circle' : 'warning-outline'}
                size={12}
                color={hasNvidiaKey ? COLORS.nvidia : COLORS.danger}
              />
              <Text
                style={[
                  styles.aiPillText,
                  { color: hasNvidiaKey ? COLORS.nvidia : COLORS.danger },
                ]}
              >
                {hasNvidiaKey ? 'NVIDIA AI Aktif' : 'API Key Gir'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Date Selector Pill */}
        <View style={styles.dateSelector}>
          <TouchableOpacity
            onPress={() => onChangeDate(-1)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chevron-back" size={16} color={COLORS.textSecondary} />
          </TouchableOpacity>

          <Text style={styles.dateLabel}>{formattedDate}</Text>

          <TouchableOpacity
            onPress={() => onChangeDate(1)}
            disabled={isToday}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name="chevron-forward"
              size={16}
              color={isToday ? COLORS.cardBorder : COLORS.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftCol: {
    flex: 1,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  greeting: {
    fontSize: 22,
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
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.card,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  dateLabel: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '700',
    minWidth: 50,
    textAlign: 'center',
  },
});
