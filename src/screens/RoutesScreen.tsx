import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, BackHandler, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BottomNavigation, { TabName } from '../components/BottomNavigation';
import ScreenHeader from '../components/ui/ScreenHeader';
import EmptyState from '../components/ui/EmptyState';
import { AnimatedPressable, FadeInView } from '../components/ui/Animated';
import { ThemeColors, radius, spacing } from '../utils/theme';
import { useAppTheme, useThemedStyles } from '../context/ThemeContext';
import { studentAPI, Student } from '../services/api';

interface RoutesScreenProps {
  onNavigateToMap?: () => void;
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
  onNavigateToMap,
  user,
  onBack,
  onNavigateToHome,
  onNavigateToPayment,
  onNavigateToCreate,
  onNavigateToProfile,
  onNavigateToStudentDetail
}) => {
  const activeTab: TabName = 'routes';
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudents();
  }, []);

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
        break;
      case 'map': onNavigateToMap?.(); break;
      case 'profile':
        onNavigateToProfile?.();
        break;
      default:
        break;
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Students" subtitle={`${students.length} registered`} onBack={onBack} />

      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : (
          <FlatList
            data={students}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <FadeInView delay={Math.min(index, 6) * 40}>
                <AnimatedPressable
                  style={styles.studentCard}
                  onPress={() => onNavigateToStudentDetail?.(item, item.school?.schoolName || 'N/A')}
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
                    <View style={[styles.statusDot, { backgroundColor: item.isActive ? colors.success : colors.danger }]} />
                  </View>
                  <View style={styles.studentDetails}>
                    <View style={styles.detailRow}>
                      <Ionicons name="call" size={15} color={colors.textSecondary} />
                      <Text style={styles.detailText}>{item.contactNumber}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Ionicons name="cash" size={15} color={colors.textSecondary} />
                      <Text style={styles.detailText}>₹{item.totalYearlyPayment} ({item.paymentPeriod})</Text>
                    </View>
                  </View>
                </AnimatedPressable>
              </FadeInView>
            )}
            scrollEnabled={true}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <EmptyState
                icon="people-outline"
                title="No students found"
                subtitle="Create a new student to get started"
              />
            }
          />
        )}
      </View>

      <BottomNavigation
        activeTab={activeTab}
        onTabPress={handleTabPress}
      />
    </View>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing(5),
  },
  listContent: {
    paddingBottom: 120,
  },
  studentCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing(4),
    marginBottom: spacing(3),
  },
  studentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing(3),
  },
  studentAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing(3),
  },
  avatarText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.primary,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  studentSchool: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  studentDetails: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing(3),
    gap: spacing(2),
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
    marginLeft: spacing(2),
    flex: 1,
  },
});

export default RoutesScreen;
