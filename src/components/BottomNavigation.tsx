import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type TabName = 'home' | 'payment' | 'create' | 'routes' | 'profile';

interface BottomNavigationProps {
  activeTab: TabName;
  onTabPress: (tab: TabName) => void;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ activeTab, onTabPress }) => {
  const getIconColor = (tabName: TabName) => {
    return activeTab === tabName ? '#fff' : '#95a5a6';
  };

  const getIconName = (tabName: TabName): keyof typeof Ionicons.glyphMap => {
    const iconMap: Record<TabName, keyof typeof Ionicons.glyphMap> = {
      home: 'home',
      payment: 'card',
      create: 'add',
      routes: 'bus',
      profile: 'person'
    };
    return iconMap[tabName];
  };

  return (
    <View style={styles.bottomNavBar}>
      <TouchableOpacity
        style={[styles.navItem, activeTab === 'home' && styles.activeNavItem]}
        onPress={() => onTabPress('home')}
      >
        <Ionicons 
          name={getIconName('home')} 
          size={22} 
          color={getIconColor('home')}
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.navItem, activeTab === 'payment' && styles.activeNavItem]}
        onPress={() => onTabPress('payment')}
      >
        <Ionicons 
          name={getIconName('payment')} 
          size={22} 
          color={getIconColor('payment')}
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.navItem, activeTab === 'create' && styles.activeNavItem]}
        onPress={() => onTabPress('create')}
      >
        <Ionicons 
          name={getIconName('create')} 
          size={22} 
          color={getIconColor('create')}
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.navItem, activeTab === 'routes' && styles.activeNavItem]}
        onPress={() => onTabPress('routes')}
      >
        <Ionicons 
          name={getIconName('routes')} 
          size={22} 
          color={getIconColor('routes')}
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.navItem, activeTab === 'profile' && styles.activeNavItem]}
        onPress={() => onTabPress('profile')}
      >
        <Ionicons 
          name={getIconName('profile')} 
          size={22} 
          color={getIconColor('profile')}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  bottomNavBar: {
    position: 'absolute',
    bottom: 15,
    left: 40,
    right: 40,
    backgroundColor: '#1a1a1a',
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 12,
  },
  activeNavItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
});

export default BottomNavigation;