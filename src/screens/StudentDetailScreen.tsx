import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  BackHandler,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BottomNavigation, { TabName } from '../components/BottomNavigation';
import { Student } from '../services/api';

interface StudentDetailScreenProps {
  student: Student;
  schoolName: string;
  onBack: () => void;
  onNavigateToHome?: () => void;
  onNavigateToPayment?: () => void;
  onNavigateToCreate?: () => void;
  onNavigateToRoutes?: () => void;
  onNavigateToProfile?: () => void;
}

const StudentDetailScreen: React.FC<StudentDetailScreenProps> = ({
  student,
  schoolName,
  onBack,
  onNavigateToHome,
  onNavigateToPayment,
  onNavigateToCreate,
  onNavigateToRoutes,
  onNavigateToProfile
}) => {
  const activeTab: TabName = 'create';

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
        onNavigateToRoutes?.();
        break;
      case 'profile':
        onNavigateToProfile?.();
        break;
      default:
        break;
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Student Details</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Student Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.largeAvatar}>
            <Text style={styles.largeAvatarText}>{getInitials(student.name)}</Text>
          </View>
          <Text style={styles.studentName}>{student.name}</Text>
          <Text style={styles.schoolNameText}>{schoolName}</Text>
        </View>

        {/* Details Card */}
        <View style={styles.detailsCard}>
          {/* Contact Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact Information</Text>
            
            <View style={styles.detailItem}>
              <View style={styles.detailIconContainer}>
                <Ionicons name="call" size={20} color="#000" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Phone Number</Text>
                <Text style={styles.detailValue}>{student.contactNumber}</Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          {/* School Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>School Information</Text>
            
            <View style={styles.detailItem}>
              <View style={styles.detailIconContainer}>
                <Ionicons name="school" size={20} color="#000" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>School Name</Text>
                <Text style={styles.detailValue}>{schoolName}</Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <View style={styles.detailIconContainer}>
                <Ionicons name="calendar" size={20} color="#000" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Date of Joining</Text>
                <Text style={styles.detailValue}>{formatDate(student.dateOfJoining)}</Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Payment Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Information</Text>
            
            <View style={styles.detailItem}>
              <View style={styles.detailIconContainer}>
                <Ionicons name="card" size={20} color="#000" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Payment Mode</Text>
                <Text style={styles.detailValue}>{student.paymentMode}</Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <View style={styles.detailIconContainer}>
                <Ionicons name="time" size={20} color="#000" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Payment Period</Text>
                <Text style={styles.detailValue}>{student.paymentPeriod}</Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <View style={styles.detailIconContainer}>
                <Ionicons name="wallet" size={20} color="#000" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Yearly Payment</Text>
                <Text style={styles.detailValue}>₹{student.totalYearlyPayment}</Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Action Buttons */}
          <View style={styles.actionsSection}>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="call-outline" size={20} color="#000" />
              <Text style={styles.actionButtonText}>Call</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="mail-outline" size={20} color="#000" />
              <Text style={styles.actionButtonText}>Email</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="create-outline" size={20} color="#000" />
              <Text style={styles.actionButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#f9f9f9',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  largeAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  largeAvatarText: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
  },
  studentName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  schoolNameText: {
    fontSize: 14,
    color: '#666',
  },
  detailsCard: {
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  detailIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 15,
    color: '#000',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 16,
  },
  actionsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 8,
  },
  actionButton: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000',
    marginTop: 8,
  },
});

export default StudentDetailScreen;
