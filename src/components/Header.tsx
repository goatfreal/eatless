import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, FONTS } from '../theme/colors';
import { ActiveTab } from '../types/nutrition';

interface HeaderProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenSettings: () => void;
}

const NAV_LINKS: { key: ActiveTab; label: string }[] = [
  { key: 'home', label: 'Günlük' },
  { key: 'scanner', label: 'Tarayıcı' },
  { key: 'fasting', label: 'Oruç' },
  { key: 'coach', label: 'Koç' },
];

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  onOpenSettings,
}) => {
  return (
    <View style={styles.bar}>
      {/* Zone 1: Single-line Brand Wordmark */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => onSelectTab('home')}
        style={styles.zoneBrand}
      >
        <Text style={styles.brandWordmark} numberOfLines={1}>
          Eatless
        </Text>
      </TouchableOpacity>

      {/* Zone 2: Concise Text Navigation Links */}
      <View style={styles.zoneNav}>
        {NAV_LINKS.map((item) => {
          const isActive = activeTab === item.key;
          return (
            <TouchableOpacity
              key={item.key}
              onPress={() => onSelectTab(item.key)}
              activeOpacity={0.7}
              style={styles.navItem}
            >
              <Text
                style={[
                  styles.navText,
                  isActive && styles.navTextActive,
                ]}
                numberOfLines={1}
              >
                {item.label}
              </Text>
              {isActive && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Zone 3: 1 Primary Action */}
      <TouchableOpacity
        onPress={onOpenSettings}
        activeOpacity={0.75}
        style={[
          styles.primaryAction,
          activeTab === 'profile' && styles.primaryActionActive,
        ]}
      >
        <Text
          style={[
            styles.primaryActionText,
            activeTab === 'profile' && styles.primaryActionTextActive,
          ]}
          numberOfLines={1}
        >
          Profil
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 54,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  zoneBrand: {
    flexShrink: 0,
    marginRight: 10,
  },
  brandWordmark: {
    fontFamily: FONTS.displayBold,
    fontSize: 19,
    color: COLORS.ink,
    letterSpacing: -0.5,
  },
  zoneNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  navItem: {
    paddingVertical: 6,
    position: 'relative',
    alignItems: 'center',
  },
  navText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.inkMuted,
  },
  navTextActive: {
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.ink,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -11,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: COLORS.ink,
  },
  primaryAction: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    backgroundColor: COLORS.surface,
    marginLeft: 8,
  },
  primaryActionActive: {
    backgroundColor: COLORS.ink,
    borderColor: COLORS.ink,
  },
  primaryActionText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 12,
    color: COLORS.ink,
  },
  primaryActionTextActive: {
    color: COLORS.surface,
  },
});
