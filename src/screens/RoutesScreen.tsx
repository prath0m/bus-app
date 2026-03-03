import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, BackHandler, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BottomNavigation, { TabName } from '../components/BottomNavigation';
import { studentAPI, Student } from '../services/api';

interface RoutesScreenProps {
  user: {
    id: string;
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
  onNavigateToStudentDetail?: (student: Student, schoolName: string) => void;
}

const RoutesScreen: React.FC<RoutesScreenProps> = ({
  user,
  onBack,
  onNavigateToHome,
  onNavigateToPayment,
  onNavigateToCreate,
  onNavigateToProfile,
  onNavigateToStudentDetail
}) => {
  const activeTab: TabName = 'routes';
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch students on component mount
  useEffect(() => {
    fetchStudents();
  }, []);

  // Handle Android back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      onBack();
      return true;
    });

    return () => backHandler.remove();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const data = await studentAPI.getUserStudents(user.id);
      setStudents(data);
    } catch (error) {
      console.error('Failed to fetch students:', error);
    } finally {
      setLoading(false);
    }
  };

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
        <Text style={styles.headerTitle}>Students</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#2c3e50" />
        ) : students.length > 0 ? (
          <FlatList
            data={students}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.studentCard}
                onPress={() => onNavigateToStudentDetail?.(item, item.school?.schoolName || 'N/A')}
                activeOpacity={0.7}
              >
                <View style={styles.studentHeader}>
                  <View style={styles.studentAvatar}>
                    <Text style={styles.avatarText}>
                      {item.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.studentInfo}>
                    <Text style={styles.studentName}>{item.name}</Text>
                    <Text style={styles.studentSchool}>{item.school?.schoolName || 'N/A'}</Text>
                  </View>
                </View>
                <View style={styles.studentDetails}>
                  <View style={styles.detailRow}>
                    <Ionicons name="call" size={16} color="#7f8c8d" />
                    <Text style={styles.detailText}>{item.contactNumber}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="cash" size={16} color="#7f8c8d" />
                    <Text style={styles.detailText}>₹{item.totalYearlyPayment} ({item.paymentPeriod})</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="checkmark-circle" size={16} color={item.isActive ? '#27ae60' : '#e74c3c'} />
                    <Text style={[styles.detailText, { color: item.isActive ? '#27ae60' : '#e74c3c' }]}>
                      {item.isActive ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
            scrollEnabled={true}
            contentContainerStyle={styles.listContent}
          />
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="people" size={80} color="#2c3e50" />
            <Text style={styles.emptyTitle}>No Students Found</Text>
            <Text style={styles.emptySubtitle}>Create a new student to get started</Text>
          </View>
        )}
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
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  listContent: {
    paddingBottom: 20,
  },
  studentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  studentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  studentAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  studentSchool: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  studentDetails: {
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
    paddingTop: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 13,
    color: '#34495e',
    marginLeft: 8,
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
  },
});

export default RoutesScreen;