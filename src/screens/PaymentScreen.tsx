import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  BackHandler,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BottomNavigation, { TabName } from '../components/BottomNavigation';
import ScreenHeader from '../components/ui/ScreenHeader';
import SummaryStat from '../components/ui/SummaryStat';
import PaymentRow from '../components/ui/PaymentRow';
import EmptyState from '../components/ui/EmptyState';
import AcademicMonthPicker from '../components/ui/AcademicMonthPicker';
import StatusFilterChips, { StatusFilterValue } from '../components/ui/StatusFilterChips';
import { FadeInView } from '../components/ui/Animated';
import { ThemeColors, radius, spacing } from '../utils/theme';
import { useAppTheme, useThemedStyles } from '../context/ThemeContext';
import { paymentAPI, Payment, PaymentDashboard } from '../services/api';
import { getWhatsAppTemplate, DEFAULT_WHATSAPP_TEMPLATE } from '../utils/preferences';
import { fillTemplate, sendWhatsAppReminder, buildReceiptMessage } from '../utils/whatsapp';
import { notifyOverdueSummaryOncePerDay } from '../utils/notifications';
import { getAcademicStartYear } from '../utils/academicYear';

interface PaymentScreenProps {
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
  onNavigateToCreate?: () => void;
  onNavigateToRoutes?: () => void;
  onNavigateToProfile?: () => void;
  onNavigateToHistory?: () => void;
}

const getInitials = (name: string) => name.split(' ').map((n) => n.charAt(0)).join('').slice(0, 2).toUpperCase();

const PaymentScreen: React.FC<PaymentScreenProps> = ({
  user,
  onBack,
  onNavigateToHome,
  onNavigateToCreate,
  onNavigateToRoutes,
  onNavigateToProfile,
  onNavigateToHistory,
}) => {
  const activeTab: TabName = 'payment';
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const today = new Date();
  const [academicStartYear, setAcademicStartYear] = useState(getAcademicStartYear(today));
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [dashboard, setDashboard] = useState<PaymentDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>('All');
  const [busyPaymentId, setBusyPaymentId] = useState<string | null>(null);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      onBack();
      return true;
    });
    return () => backHandler.remove();
  }, []);

  const loadDashboard = useCallback(async (showSpinner = true) => {
    try {
      if (showSpinner) setLoading(true);
      const data = await paymentAPI.getDashboard(user.id, year, month);
      setDashboard(data);

      const isCurrentMonth = year === today.getFullYear() && month === today.getMonth() + 1;
      if (isCurrentMonth) {
        notifyOverdueSummaryOncePerDay(data.overdueCount);
      }
    } catch (error) {
      console.error('Failed to load payment dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user.id, year, month]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleSelectMonth = (next: { year: number; month: number }) => {
    setYear(next.year);
    setMonth(next.month);
  };

  const handleSelectYear = (nextStartYear: number) => {
    setAcademicStartYear(nextStartYear);
    setYear(nextStartYear);
    setMonth(4);
  };

  const handleMarkPaid = (payment: Payment) => {
    Alert.alert(
      'Mark as Paid',
      `Mark ₹${payment.amountDue} from ${payment.student?.name} as paid for ${payment.monthName} ${payment.year}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Paid',
          onPress: async () => {
            try {
              setBusyPaymentId(payment.id);
              await paymentAPI.markPaid(payment.id);
              await loadDashboard(false);
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
    if (!payment.student) return;
    const template = await getWhatsAppTemplate().catch(() => DEFAULT_WHATSAPP_TEMPLATE);
    const message = fillTemplate(template, {
      name: payment.student.name,
      amount: payment.amountDue - payment.amountPaid,
      month: payment.monthName,
      year: payment.year,
      ownerName: `${user.firstName} ${user.lastName}`,
    });
    sendWhatsAppReminder(payment.student.contactNumber, message);
  };

  const handleSendReceipt = (payment: Payment) => {
    if (!payment.student) return;
    const message = buildReceiptMessage({
      name: payment.student.name,
      amount: payment.amountPaid,
      month: payment.monthName,
      year: payment.year,
      paidDate: payment.paidDate,
      paymentMode: payment.paymentMode,
      ownerName: `${user.firstName} ${user.lastName}`,
    });
    sendWhatsAppReminder(payment.student.contactNumber, message);
  };

  const handleTabPress = (tab: TabName) => {
    switch (tab) {
      case 'home': onNavigateToHome?.(); break;
      case 'payment': break;
      case 'create': onNavigateToCreate?.(); break;
      case 'routes': onNavigateToRoutes?.(); break;
      case 'profile': onNavigateToProfile?.(); break;
      default: break;
    }
  };

  const filteredStudents = (dashboard?.students ?? [])
    .filter((p) => p.student?.name.toLowerCase().includes(search.toLowerCase()))
    .filter((p) => statusFilter === 'All' || p.status === statusFilter);

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Payments"
        subtitle="Track monthly dues at a glance"
        onBack={onBack}
        rightIcon="time-outline"
        onRightPress={onNavigateToHistory}
      />

      <AcademicMonthPicker
        startYear={academicStartYear}
        selected={{ year, month }}
        onSelectYear={handleSelectYear}
        onSelectMonth={handleSelectMonth}
      />

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredStudents}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadDashboard(false); }} colors={[colors.primary]} tintColor={colors.primary} />
          }
          ListHeaderComponent={
            <>
              <View style={styles.statsRow}>
                <SummaryStat
                  label="Collected"
                  value={`₹${dashboard?.totalCollected ?? 0}`}
                  icon="checkmark-circle"
                  tint={colors.success}
                  tintSoft={colors.successSoft}
                  delay={0}
                />
                <SummaryStat
                  label="Pending"
                  value={`₹${dashboard?.totalPending ?? 0}`}
                  icon="time"
                  tint={colors.warning}
                  tintSoft={colors.warningSoft}
                  delay={60}
                />
                <SummaryStat
                  label="Overdue"
                  value={`${dashboard?.overdueCount ?? 0}`}
                  icon="alert-circle"
                  tint={colors.danger}
                  tintSoft={colors.dangerSoft}
                  delay={120}
                />
              </View>

              <FadeInView style={styles.searchWrap} delay={160}>
                <Ionicons name="search" size={18} color={colors.textTertiary} style={{ marginRight: spacing(2) }} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search students"
                  placeholderTextColor={colors.textTertiary}
                  value={search}
                  onChangeText={setSearch}
                />
              </FadeInView>

              <FadeInView delay={190}>
                <StatusFilterChips value={statusFilter} onChange={setStatusFilter} />
              </FadeInView>

              {filteredStudents.length > 0 && (
                <Text style={styles.listTitle}>Students · {filteredStudents.length}</Text>
              )}
            </>
          }
          renderItem={({ item, index }) => (
            <PaymentRow
              title={item.student?.name ?? 'Student'}
              subtitle={item.student?.school?.schoolName}
              amount={item.amountDue - item.amountPaid > 0 ? item.amountDue - item.amountPaid : item.amountDue}
              status={item.status}
              avatarLabel={item.student ? getInitials(item.student.name) : undefined}
              onMarkPaid={busyPaymentId === item.id ? undefined : () => handleMarkPaid(item)}
              onRemind={() => handleRemind(item)}
              onSendReceipt={item.status === 'Paid' ? () => handleSendReceipt(item) : undefined}
              delay={Math.min(index, 6) * 40}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon="card-outline"
              title="No students to show"
              subtitle="Add students from the Create tab to start tracking payments"
            />
          }
        />
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
  listContent: {
    paddingHorizontal: spacing(5),
    paddingBottom: 120,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing(3),
    marginBottom: spacing(4),
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(3),
    marginBottom: spacing(4),
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    padding: 0,
  },
  listTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: spacing(2),
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

export default PaymentScreen;
