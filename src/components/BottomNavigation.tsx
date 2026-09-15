import React, { useEffect } from 'react';
import { View, Text, StyleSheet, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeColors, radius, spacing, shadow } from '../utils/theme';
import { useAppTheme, useThemedStyles } from '../context/ThemeContext';
import { AnimatedPressable } from './ui/Animated';

export type TabName = 'home' | 'payment' | 'create' | 'routes' | 'profile';

interface BottomNavigationProps {
  activeTab: TabName;
  onTabPress: (tab: TabName) => void;
}

const TABS: { name: TabName; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { name: 'home', label: 'Home', icon: 'home' },
  { name: 'payment', label: 'Payments', icon: 'card' },
  { name: 'create', label: 'Add', icon: 'add-circle' },
  { name: 'routes', label: 'Students', icon: 'people' },
  { name: 'profile', label: 'Profile', icon: 'person' },
];

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ activeTab, onTabPress }) => {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
  }, [activeTab]);

  return (
    <View style={styles.bottomNavBar}>
      {TABS.map((tab) => {
        const isActive = activeTab === tab.name;
        return (
          <AnimatedPressable
            key={tab.name}
            onPress={() => onTabPress(tab.name)}
            style={[styles.navItem, isActive && styles.activeNavItem]}
          >
            <Ionicons
              name={tab.icon}
              size={20}
              color={isActive ? colors.onPrimary : colors.textTertiary}
            />
            {isActive && <Text style={styles.activeLabel}>{tab.label}</Text>}
          </AnimatedPressable>
        );
      })}
    </View>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  bottomNavBar: {
    position: 'absolute',
    bottom: 15,
    left: 16,
    right: 16,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    paddingVertical: spacing(2),
    paddingHorizontal: spacing(2),
    borderRadius: radius.pill,
    ...shadow.soft,
  },
  navItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing(2.5),
    borderRadius: radius.pill,
  },
  activeNavItem: {
    backgroundColor: colors.primary,
    flex: 1.6,
  },
  activeLabel: {
    color: colors.onPrimary,
    fontSize: 12,
    fontWeight: '700',
    marginLeft: spacing(1.5),
  },
});

export default BottomNavigation;
