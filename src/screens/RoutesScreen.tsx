import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, BackHandler } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BottomNavigation, { TabName } from '../components/BottomNavigation';

interface RoutesScreenProps {
  user: {
    firstName: string;
    lastName: string;
    email: string;
    mobileNumber: string;
    role: string;
  };
  onBack: () => void;
  onNavigateToHome?: () => void;
  onNavigateToPayment?: () => void;
  onNavigateToCreate?: () => void;
  onNavigateToProfile?: () => void;
}

const RoutesScreen: React.FC<RoutesScreenProps> = ({
  user,
  onBack,
  onNavigateToHome,
  onNavigateToPayment,
  onNavigateToCreate,
  onNavigateToProfile
}) => {
  const activeTab: TabName = 'routes';

  // Handle Android back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      onBack();
      return true;
    });

    return () => backHandler.remove();
  }, []);

  const handleTabPress = (tab: TabName) => {
    switch (tab) {
      case 'home':
        onNavigateToHome?.();
        break;
      case 'payment':
        onNavigateToPayment?.();
        break;
      case 'create':
        onNavigateToCreate?.();
        break;
      case 'routes':
        console.log('Already on Routes');
        break;
      case 'profile':
        onNavigateToProfile?.();
        break;
      default:
        break;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bus Routes</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.centerContent}>
          <Ionicons name="bus" size={80} color="#2c3e50" />
          <Text style={styles.title}>Routes Screen</Text>
          <Text style={styles.subtitle}>Bus Route Information</Text>
          <Text style={styles.description}>
            Check bus routes, timings, and pickup/drop-off locations for your school.
          </Text>
        </View>
      </View>

      {/* Bottom Navigation */}
      <BottomNavigation 
        activeTab={activeTab}
        onTabPress={handleTabPress}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  centerContent: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 20,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#7f8c8d',
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    color: '#95a5a6',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default RoutesScreen;