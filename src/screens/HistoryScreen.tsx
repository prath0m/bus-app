import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  BackHandler,
  FlatList,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BottomNavigation, { TabName } from '../components/BottomNavigation';
import ScreenHeader from '../components/ui/ScreenHeader';
import PaymentRow from '../components/ui/PaymentRow';
import EmptyState from '../components/ui/EmptyState';
import StatusFilterChips, { StatusFilterValue } from '../components/ui/StatusFilterChips';
import { AnimatedPressable } from '../components/ui/Animated';
import { ThemeColors, radius, spacing } from '../utils/theme';
import { useAppTheme, useThemedStyles } from '../context/ThemeContext';
import { studentAPI, paymentAPI, Student, Payment } from '../services/api';
import { getWhatsAppTemplate, DEFAULT_WHATSAPP_TEMPLATE } from '../utils/preferences';
import { fillTemplate, sendWhatsAppReminder, buildReceiptMessage } from '../utils/whatsapp';

interface HistoryScreenProps {
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
  onNavigateToRoutes?: () => void;
  onNavigateToProfile?: () => void;
}

const HistoryScreen: React.FC<HistoryScreenProps> = ({
  onNavigateToMap,
  user,
  onBack,
  onNavigateToHome,
  onNavigateToPayment,
  onNavigateToCreate,
  onNavigateToRoutes,
  onNavigateToProfile,
}) => {
  const activeTab: TabName = 'payment';
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [history, setHistory] = useState<Payment[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [busyPaymentId, setBusyPaymentId] = useState<string | null>(null);
  const [studentSearch, setStudentSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>('All');

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      onBack();
      return true;
    });
    return () => backHandler.remove();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setLoadingStudents(true);
        const data = await studentAPI.getUserStudents(user.id);
        setStudents(data);
        if (data.length > 0) setSelectedStudentId(data[0].id);
      } catch (error) {
        console.error('Failed to fetch students:', error);
      } finally {
        setLoadingStudents(false);
      }
    })();
  }, [user.id]);

  const loadHistory = useCallback(async (studentId: string) => {
    try {
      setLoadingHistory(true);
      const data = await paymentAPI.getStudentHistory(studentId);
      setHistory(data);
    } catch (error) {
      console.error('Failed to load payment history:', error);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    if (selectedStudentId) loadHistory(selectedStudentId);
  }, [selectedStudentId, loadHistory]);

  const selectedStudent = students.find((s) => s.id === selectedStudentId);
  const filteredStudents = students.filter((s) => s.name.toLowerCase().includes(studentSearch.toLowerCase()));
  const filteredHistory = history.filter((p) => statusFilter === 'All' || p.status === statusFilter);

  const handleMarkPaid = (payment: Payment) => {
    Alert.alert(
      'Mark as Paid',
      `Mark ₹${payment.amountDue} as paid for ${payment.monthName} ${payment.year}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Paid',
          onPress: async () => {
            try {
              setBusyPaymentId(payment.id);
              await paymentAPI.markPaid(payment.id);
              if (selectedStudentId) await loadHistory(selectedStudentId);
            } catch (error) {
              console.error('Failed to mark payment as paid:', error);
              Alert.alert('Error', 'Failed to mark payment as paid. Please try again.');
            } finally {
              setBusyPaymentId(null);
            }
          },
        },
      ]
    );
  };

  const handleRemind = async (payment: Payment) => {
    if (!selectedStudent) return;
    const template = await getWhatsAppTemplate().catch(() => DEFAULT_WHATSAPP_TEMPLATE);
    const message = fillTemplate(template, {
      name: selectedStudent.name,
      amount: payment.amountDue - payment.amountPaid,
      month: payment.monthName,
      year: payment.year,
      ownerName: `${user.firstName} ${user.lastName}`,
    });
    sendWhatsAppReminder(selectedStudent.contactNumber, message);
  };

  const handleSendReceipt = (payment: Payment) => {
    if (!selectedStudent) return;
    const message = buildReceiptMessage({
      name: selectedStudent.name,
      amount: payment.amountPaid,
      month: payment.monthName,
      year: payment.year,
      paidDate: payment.paidDate,
      paymentMode: payment.paymentMode,
      ownerName: `${user.firstName} ${user.lastName}`,
    });
    sendWhatsAppReminder(selectedStudent.contactNumber, message);
  };

  const handleTabPress = (tab: TabName) => {
    switch (tab) {
      case 'home': onNavigateToHome?.(); break;
      case 'payment': onNavigateToPayment?.(); break;
      case 'create': onNavigateToCreate?.(); break;
      case 'routes': onNavigateToRoutes?.(); break;
      case 'map': onNavigateToMap?.(); break;
      case 'profile': onNavigateToProfile?.(); break;
      default: break;
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="History" subtitle="Every month, per student" onBack={onBack} />

      {loadingStudents ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : students.length === 0 ? (
        <EmptyState icon="time-outline" title="No students yet" subtitle="Add a student to see their payment history" />
      ) : (
        <>
          <View style={styles.searchWrap}>
            <Ionicons name="search" size={18} color={colors.textTertiary} style={{ marginRight: spacing(2) }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search students"
              placeholderTextColor={colors.textTertiary}
              value={studentSearch}
              onChangeText={setStudentSearch}
            />
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipsScroll}
            contentContainerStyle={styles.chipsRow}
          >
            {filteredStudents.map((student) => {
              const isActive = student.id === selectedStudentId;
              return (
                <AnimatedPressable
                  key={student.id}
                  style={[styles.chip, isActive && styles.chipActive]}
                  onPress={() => setSelectedStudentId(student.id)}
                >
                  <Text style={[styles.chipText, isActive && styles.chipTextActive]} numberOfLines={1}>
                    {student.name}
                  </Text>
                </AnimatedPressable>
              );
            })}
          </ScrollView>

          <View style={styles.statusFilterWrap}>
            <StatusFilterChips value={statusFilter} onChange={setStatusFilter} />
          </View>

          {loadingHistory ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <FlatList
              data={filteredHistory}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              renderItem={({ item, index }) => (
                <PaymentRow
                  title={`${item.monthName} ${item.year}`}
                  subtitle={item.status === 'Paid' && item.paidDate ? `Paid on ${new Date(item.paidDate).toLocaleDateString()}` : `Due ${new Date(item.dueDate).toLocaleDateString()}`}
                  amount={item.amountDue}
                  status={item.status}
                  onMarkPaid={item.status === 'Paid' || busyPaymentId === item.id ? undefined : () => handleMarkPaid(item)}
                  onRemind={item.status === 'Paid' ? undefined : () => handleRemind(item)}
                  onSendReceipt={item.status === 'Paid' ? () => handleSendReceipt(item) : undefined}
                  delay={Math.min(index, 6) * 40}
                />
              )}
              ListEmptyComponent={<EmptyState icon="calendar-outline" title="No payment history yet" />}
            />
          )}
        </>
      )}

      <BottomNavigation activeTab={activeTab} onTabPress={handleTabPress} />
    </View>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(3),
    marginHorizontal: spacing(5),
    marginBottom: spacing(3),
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    padding: 0,
  },
  statusFilterWrap: {
    paddingHorizontal: spacing(5),
  },
  chipsScroll: {
    flexGrow: 0,
    flexShrink: 0,
  },
  chipsRow: {
    paddingHorizontal: spacing(5),
    paddingBottom: spacing(4),
    gap: spacing(2),
  },
  chip: {
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(2.5),
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    marginRight: spacing(2),
    maxWidth: 160,
  },
  chipActive: {
    backgroundColor: colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.onPrimary,
  },
  listContent: {
    paddingHorizontal: spacing(5),
    paddingBottom: 120,
  },
});

export default HistoryScreen;
