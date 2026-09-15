import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  BackHandler,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { authAPI, paymentAPI, PaymentDashboard, Payment } from '../services/api';
import BottomNavigation, { TabName } from '../components/BottomNavigation';
import { AnimatedPressable, FadeInView } from '../components/ui/Animated';
import ProgressRing from '../components/ui/ProgressRing';
import PaymentRow from '../components/ui/PaymentRow';
import { ThemeColors, radius, spacing, shadow } from '../utils/theme';
import { useAppTheme, useThemedStyles } from '../context/ThemeContext';
import { getWhatsAppTemplate, DEFAULT_WHATSAPP_TEMPLATE } from '../utils/preferences';
import { fillTemplate, sendWhatsAppReminder, buildReceiptMessage } from '../utils/whatsapp';

const { height } = Dimensions.get('window');

interface HomeScreenProps {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    mobileNumber: string;
    role: string;
  };
  onLogout: () => void;
  onNavigateToProfile: () => void;
  onNavigateToSettings: () => void;
  onNavigateToPayment?: () => void;
  onNavigateToCreate?: () => void;
  onNavigateToRoutes?: () => void;
  onNavigateToHistory?: () => void;
}

const getInitials = (name: string) => name.split(' ').map((n) => n.charAt(0)).join('').slice(0, 2).toUpperCase();

const formatRelativeTime = (dateString: string): string => {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 5) return `${diffWeeks} week${diffWeeks === 1 ? '' : 's'} ago`;
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const HomeScreen = ({
  user,
  onNavigateToProfile,
  onLogout,
  onNavigateToSettings,
  onNavigateToPayment,
  onNavigateToCreate,
  onNavigateToRoutes,
  onNavigateToHistory,
}: HomeScreenProps) => {
  const activeTab: TabName = 'home';
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      onLogout();
      return true;
    });

    return () => backHandler.remove();
  }, []);

  const today = new Date();
  const currentDate = today.getDate();
  const [selectedDate, setSelectedDate] = useState(currentDate);
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [summary, setSummary] = useState<PaymentDashboard | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [busyPaymentId, setBusyPaymentId] = useState<string | null>(null);

  const scrollViewRef = useRef<ScrollView>(null);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
    setSelectedDate(1);
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
    setSelectedDate(1);
  };

  useEffect(() => {
    if (scrollViewRef.current) {
      const dateToScrollTo = (currentMonth === today.getMonth() && currentYear === today.getFullYear())
        ? currentDate
        : selectedDate;

      const itemWidth = 72;
      const scrollPosition = Math.max(0, (dateToScrollTo - 3) * itemWidth);
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ x: scrollPosition, animated: true });
      }, 300);
    }
  }, [currentMonth, currentYear, selectedDate]);

  const loadSummary = useCallback(async () => {
    try {
      setLoadingSummary(true);
      const data = await paymentAPI.getDashboard(user.id);
      setSummary(data);
    } catch (error) {
      console.error('Failed to load home summary:', error);
    } finally {
      setLoadingSummary(false);
    }
  }, [user.id]);

  const loadRecent = useCallback(async () => {
    try {
      setLoadingRecent(true);
      const data = await paymentAPI.getRecent(user.id, 5);
      setRecentPayments(data);
    } catch (error) {
      console.error('Failed to load recent activity:', error);
    } finally {
      setLoadingRecent(false);
    }
  }, [user.id]);

  useEffect(() => {
    loadSummary();
    loadRecent();
  }, [loadSummary, loadRecent]);

  const handleLogout = async () => {
    try {
      await authAPI.logout();
      onLogout();
    } catch (error) {
      console.error('Logout error:', error);
      onLogout();
    }
  };

  const handleTabPress = (tab: TabName) => {
    switch (tab) {
      case 'home':
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
        onNavigateToProfile();
        break;
      default:
        break;
    }
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
              await loadSummary();
              await loadRecent();
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

  const urgentPayments = (summary?.students ?? [])
    .filter((p) => p.status !== 'Paid')
    .sort((a, b) => (a.status === b.status ? 0 : a.status === 'Overdue' ? -1 : 1))
    .slice(0, 5);

  const totalTracked = (summary?.totalCollected ?? 0) + (summary?.totalPending ?? 0);
  const collectedProgress = totalTracked > 0 ? (summary?.totalCollected ?? 0) / totalTracked : 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <AnimatedPressable style={styles.profileCircle} onPress={onNavigateToProfile}>
            <Text style={styles.profileInitials}>
              {user.firstName.charAt(0)}{user.lastName.charAt(0)}
            </Text>
          </AnimatedPressable>

          <AnimatedPressable style={styles.settingsButton} onPress={onNavigateToSettings}>
            <Ionicons name="settings-outline" size={22} color={colors.textPrimary} />
          </AnimatedPressable>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting Section */}
        <FadeInView style={styles.greetingSection}>
          <Text style={styles.greeting}>Hello {user.firstName}!</Text>
        </FadeInView>

        {/* This Month Summary Card */}
        <AnimatedPressable
          style={styles.summaryCard}
          onPress={onNavigateToPayment}
          scaleTo={0.98}
        >
          <FadeInView delay={60} style={{ width: '100%' }}>
            <View style={styles.summaryHeaderRow}>
              <Text style={styles.summaryTitle}>This Month</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.onPrimary} />
            </View>
            {loadingSummary ? (
              <Text style={styles.summaryLoading}>Loading…</Text>
            ) : (
              <View style={styles.summaryBody}>
                <ProgressRing
                  progress={collectedProgress}
                  color={colors.onPrimary}
                  trackColor="rgba(255,255,255,0.25)"
                  label={`${Math.round(collectedProgress * 100)}%`}
                  sublabel="collected"
                />
                <View style={styles.summaryStatsCol}>
                  <View style={styles.summaryStat}>
                    <Text style={styles.summaryStatValue}>₹{summary?.totalCollected ?? 0}</Text>
                    <Text style={styles.summaryStatLabel}>Collected</Text>
                  </View>
                  <View style={styles.summaryStat}>
                    <Text style={styles.summaryStatValue}>{summary?.dueCount ?? 0}</Text>
                    <Text style={styles.summaryStatLabel}>Due</Text>
                  </View>
                  <View style={styles.summaryStat}>
                    <Text style={styles.summaryStatValue}>{summary?.overdueCount ?? 0}</Text>
                    <Text style={styles.summaryStatLabel}>Overdue</Text>
                  </View>
                </View>
              </View>
            )}
          </FadeInView>
        </AnimatedPressable>

        {/* Quick Actions */}
        <FadeInView delay={100} style={styles.quickActionsRow}>
          <AnimatedPressable style={styles.quickAction} onPress={onNavigateToCreate}>
            <View style={styles.quickActionIcon}>
              <Ionicons name="person-add" size={20} color={colors.primary} />
            </View>
            <Text style={styles.quickActionText}>Add Student</Text>
          </AnimatedPressable>
          <AnimatedPressable style={styles.quickAction} onPress={onNavigateToPayment}>
            <View style={styles.quickActionIcon}>
              <Ionicons name="card" size={20} color={colors.primary} />
            </View>
            <Text style={styles.quickActionText}>Payments</Text>
          </AnimatedPressable>
          <AnimatedPressable style={styles.quickAction} onPress={onNavigateToHistory}>
            <View style={styles.quickActionIcon}>
              <Ionicons name="time" size={20} color={colors.primary} />
            </View>
            <Text style={styles.quickActionText}>History</Text>
          </AnimatedPressable>
        </FadeInView>

        {/* Needs Attention */}
        {(loadingSummary || urgentPayments.length > 0) && (
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Needs Attention</Text>
              {urgentPayments.length > 0 && (
                <AnimatedPressable onPress={onNavigateToPayment}>
                  <Text style={styles.sectionLink}>View all</Text>
                </AnimatedPressable>
              )}
            </View>
            {loadingSummary ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              urgentPayments.map((payment, index) => (
                <PaymentRow
                  key={payment.id}
                  title={payment.student?.name ?? 'Student'}
                  subtitle={payment.student?.school?.schoolName}
                  amount={payment.amountDue - payment.amountPaid > 0 ? payment.amountDue - payment.amountPaid : payment.amountDue}
                  status={payment.status}
                  avatarLabel={payment.student ? getInitials(payment.student.name) : undefined}
                  onMarkPaid={busyPaymentId === payment.id ? undefined : () => handleMarkPaid(payment)}
                  onRemind={() => handleRemind(payment)}
                  delay={index * 40}
                />
              ))
            )}
          </View>
        )}

        {/* Recent Activity */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
          </View>
          {loadingRecent ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : recentPayments.length === 0 ? (
            <Text style={styles.emptyText}>No payments recorded yet.</Text>
          ) : (
            recentPayments.map((payment, index) => (
              <FadeInView key={payment.id} delay={index * 40} style={styles.activityRow}>
                <View style={styles.activityAvatar}>
                  <Text style={styles.activityAvatarText}>
                    {payment.student ? getInitials(payment.student.name) : '?'}
                  </Text>
                </View>
                <View style={styles.activityInfo}>
                  <Text style={styles.activityText}>
                    <Text style={styles.activityName}>{payment.student?.name ?? 'Student'}</Text> paid ₹{payment.amountPaid}
                  </Text>
                  <Text style={styles.activityTime}>
                    {payment.paidDate ? formatRelativeTime(payment.paidDate) : ''} · {payment.monthName} {payment.year}
                  </Text>
                </View>
                <AnimatedPressable onPress={() => handleSendReceipt(payment)} style={styles.activityReceiptButton}>
                  <Ionicons name="receipt-outline" size={18} color={colors.success} />
                </AnimatedPressable>
              </FadeInView>
            ))
          )}
        </View>

        {/* Date Selector with Horizontal Scroll */}
        <FadeInView style={styles.calendarContainer} delay={160}>
          <View style={styles.calendarHeader}>
            <AnimatedPressable onPress={goToPreviousMonth} style={styles.calendarArrow}>
              <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
            </AnimatedPressable>
            <Text style={styles.calendarMonth}>
              {monthNames[currentMonth]} {currentYear}
            </Text>
            <AnimatedPressable onPress={goToNextMonth} style={styles.calendarArrow}>
              <Ionicons name="chevron-forward" size={22} color={colors.textPrimary} />
            </AnimatedPressable>
          </View>

          <ScrollView
            ref={scrollViewRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.dateScrollView}
            contentContainerStyle={styles.dateScrollContainer}
          >
            {Array.from({ length: getDaysInMonth(currentMonth, currentYear) }, (_, i) => {
              const date = i + 1;
              const isToday = date === currentDate &&
                currentMonth === today.getMonth() &&
                currentYear === today.getFullYear();

              const getHolidays = (month: number) => {
                const holidays: { [key: number]: number[] } = {
                  0: [1, 26],
                  2: [8],
                  3: [14],
                  7: [15],
                  9: [2, 10, 25, 31],
                  11: [25]
                };
                return holidays[month] || [];
              };

              const isHoliday = getHolidays(currentMonth).includes(date);
              const isSelected = date === selectedDate;
              const isSunday = new Date(currentYear, currentMonth, date).getDay() === 0;

              return (
                <AnimatedPressable
                  key={date}
                  style={styles.scrollDateItem}
                  onPress={() => setSelectedDate(date)}
                  scaleTo={0.85}
                >
                  <Text style={styles.dayOfWeek}>
                    {new Date(currentYear, currentMonth, date).toLocaleDateString('en-US', { weekday: 'short' })}
                  </Text>
                  <View
                    style={[
                      styles.dateCircle,
                      isSelected && styles.selectedDate,
                      isToday && !isSelected && styles.todayDate,
                      isHoliday && !isSelected && !isToday && styles.holidayDate,
                      isSunday && !isSelected && !isToday && !isHoliday && styles.sundayDate
                    ]}
                  >
                    <Text
                      style={[
                        styles.dateText,
                        isSelected && styles.selectedDateText,
                        isToday && !isSelected && styles.todayDateText,
                        isHoliday && !isSelected && !isToday && styles.holidayDateText,
                        isSunday && !isSelected && !isToday && !isHoliday && styles.sundayDateText
                      ]}
                    >
                      {date}
                    </Text>
                  </View>
                  {isToday && (
                    <Text style={styles.todayLabel}>Today</Text>
                  )}
                  {isHoliday && !isToday && (
                    <Text style={styles.holidayLabel}>Holiday</Text>
                  )}
                  {isSunday && !isToday && !isHoliday && (
                    <Text style={styles.sundayLabel}>Sunday</Text>
                  )}
                </AnimatedPressable>
              );
            })}
          </ScrollView>
        </FadeInView>
      </ScrollView>

      {/* Bottom Navigation Bar */}
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
  header: {
    backgroundColor: colors.bg,
    paddingTop: 40,
    paddingBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing(5),
    paddingVertical: spacing(1),
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing(5),
    paddingBottom: 120,
  },
  profileCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitials: {
    color: colors.onPrimary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  settingsButton: {
    padding: spacing(2),
  },
  greetingSection: {
    marginBottom: spacing(5),
  },
  greeting: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  summaryCard: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing(5),
    marginBottom: spacing(4),
    ...shadow.soft,
  },
  summaryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing(4),
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.onPrimary,
  },
  summaryLoading: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.onPrimary,
    opacity: 0.8,
  },
  summaryBody: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryStatsCol: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginLeft: spacing(4),
  },
  summaryStat: {
    flex: 1,
  },
  summaryStatValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.onPrimary,
    marginBottom: 2,
  },
  summaryStatLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.onPrimary,
    opacity: 0.8,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: spacing(3),
    marginBottom: spacing(5),
  },
  quickAction: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: spacing(3.5),
    alignItems: 'center',
    ...shadow.flat,
  },
  quickActionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing(2),
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sectionBlock: {
    marginBottom: spacing(5),
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing(3),
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  sectionLink: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing(3.5),
    marginBottom: spacing(2.5),
  },
  activityAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.successSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing(3),
  },
  activityAvatarText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.success,
  },
  activityReceiptButton: {
    padding: spacing(2),
  },
  activityInfo: {
    flex: 1,
  },
  activityText: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  activityName: {
    fontWeight: '700',
  },
  activityTime: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  calendarContainer: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing(4),
    ...shadow.flat,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing(5),
  },
  calendarArrow: {
    padding: spacing(2),
  },
  calendarMonth: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  dateScrollView: {
    flexGrow: 0,
    flexShrink: 0,
  },
  dateScrollContainer: {
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(2),
  },
  scrollDateItem: {
    alignItems: 'center',
    marginHorizontal: 6,
    width: 60,
  },
  dayOfWeek: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
    fontWeight: '500',
  },
  dateCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  selectedDate: {
    backgroundColor: colors.primary,
  },
  todayDate: {
    backgroundColor: colors.primary,
    ...shadow.soft,
  },
  holidayDate: {
    backgroundColor: colors.dangerSoft,
    borderWidth: 2,
    borderColor: colors.danger,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  selectedDateText: {
    color: colors.onPrimary,
  },
  todayDateText: {
    color: colors.onPrimary,
    fontWeight: 'bold',
  },
  holidayDateText: {
    color: colors.danger,
  },
  holidayLabel: {
    fontSize: 10,
    color: colors.danger,
    textAlign: 'center',
  },
  todayLabel: {
    fontSize: 10,
    color: colors.textPrimary,
    textAlign: 'center',
    fontWeight: '600',
  },
  sundayDate: {
    backgroundColor: colors.warningSoft,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  sundayDateText: {
    color: colors.warning,
    fontWeight: '600',
  },
  sundayLabel: {
    fontSize: 10,
    color: colors.warning,
    textAlign: 'center',
    fontWeight: '600',
  },
});

export default HomeScreen;
