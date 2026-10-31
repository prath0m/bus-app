import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  BackHandler,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BottomNavigation, { TabName } from '../components/BottomNavigation';
import ScreenHeader from '../components/ui/ScreenHeader';
import Card from '../components/ui/Card';
import PaymentRow from '../components/ui/PaymentRow';
import { AnimatedPressable, FadeInView } from '../components/ui/Animated';
import { ThemeColors, radius, spacing } from '../utils/theme';
import { useAppTheme, useThemedStyles } from '../context/ThemeContext';
import { Student, Payment, paymentAPI } from '../services/api';
import { getWhatsAppTemplate, DEFAULT_WHATSAPP_TEMPLATE } from '../utils/preferences';
import { fillTemplate, sendWhatsAppReminder, buildReceiptMessage } from '../utils/whatsapp';

interface StudentDetailScreenProps {
  onNavigateToMap?: () => void;
  student: Student;
  schoolName: string;
  user?: { firstName: string; lastName: string };
  onBack: () => void;
  onNavigateToHome?: () => void;
  onNavigateToPayment?: () => void;
  onNavigateToCreate?: () => void;
  onNavigateToRoutes?: () => void;
  onNavigateToProfile?: () => void;
}

const StudentDetailScreen: React.FC<StudentDetailScreenProps> = ({
  onNavigateToMap,
  student,
  schoolName,
  user,
  onBack,
  onNavigateToHome,
  onNavigateToPayment,
  onNavigateToCreate,
  onNavigateToRoutes,
  onNavigateToProfile
}) => {
  const activeTab: TabName = 'create';
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const [history, setHistory] = useState<Payment[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [busyPaymentId, setBusyPaymentId] = useState<string | null>(null);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      onBack();
      return true;
    });

    return () => backHandler.remove();
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      setLoadingHistory(true);
      const data = await paymentAPI.getStudentHistory(student.id);
      setHistory(data);
    } catch (error) {
      console.error('Failed to load payment history:', error);
    } finally {
      setLoadingHistory(false);
    }
  }, [student.id]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

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
      case 'map': onNavigateToMap?.(); break;
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

  const handleCall = () => {
    Linking.openURL(`tel:${student.contactNumber}`).catch(() =>
      Alert.alert('Error', 'Unable to place a call on this device.')
    );
  };

  const handleGeneralRemind = async () => {
    const template = await getWhatsAppTemplate().catch(() => DEFAULT_WHATSAPP_TEMPLATE);
    const message = fillTemplate(template, {
      name: student.name,
      amount: student.paymentAmount ?? student.totalYearlyPayment,
      month: new Date().toLocaleDateString('en-US', { month: 'long' }),
      year: new Date().getFullYear(),
      ownerName: user ? `${user.firstName} ${user.lastName}` : '',
    });
    sendWhatsAppReminder(student.contactNumber, message);
  };

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
              await loadHistory();
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

  const handleRemindForMonth = async (payment: Payment) => {
    const template = await getWhatsAppTemplate().catch(() => DEFAULT_WHATSAPP_TEMPLATE);
    const message = fillTemplate(template, {
      name: student.name,
      amount: payment.amountDue - payment.amountPaid,
      month: payment.monthName,
      year: payment.year,
      ownerName: user ? `${user.firstName} ${user.lastName}` : '',
    });
    sendWhatsAppReminder(student.contactNumber, message);
  };

  const handleSendReceipt = (payment: Payment) => {
    const message = buildReceiptMessage({
      name: student.name,
      amount: payment.amountPaid,
      month: payment.monthName,
      year: payment.year,
      paidDate: payment.paidDate,
      paymentMode: payment.paymentMode,
      ownerName: user ? `${user.firstName} ${user.lastName}` : '',
    });
    sendWhatsAppReminder(student.contactNumber, message);
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Student Details" onBack={onBack} />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Student Avatar Section */}
        <FadeInView style={styles.avatarSection}>
          <View style={styles.largeAvatar}>
            <Text style={styles.largeAvatarText}>{getInitials(student.name)}</Text>
          </View>
          <Text style={styles.studentName}>{student.name}</Text>
          <Text style={styles.schoolNameText}>{schoolName}</Text>
        </FadeInView>

        <Card style={styles.detailsCard}>
          {/* Contact Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact Information</Text>

            <View style={styles.detailItem}>
              <View style={styles.detailIconContainer}>
                <Ionicons name="call" size={20} color={colors.primary} />
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
                <Ionicons name="school" size={20} color={colors.primary} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>School Name</Text>
                <Text style={styles.detailValue}>{schoolName}</Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <View style={styles.detailIconContainer}>
                <Ionicons name="calendar" size={20} color={colors.primary} />
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
                <Ionicons name="card" size={20} color={colors.primary} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Payment Mode</Text>
                <Text style={styles.detailValue}>{student.paymentMode}</Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <View style={styles.detailIconContainer}>
                <Ionicons name="time" size={20} color={colors.primary} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Payment Period</Text>
                <Text style={styles.detailValue}>{student.paymentPeriod}</Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <View style={styles.detailIconContainer}>
                <Ionicons name="wallet" size={20} color={colors.primary} />
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
            <AnimatedPressable style={styles.actionButton} onPress={handleCall}>
              <Ionicons name="call-outline" size={20} color={colors.textPrimary} />
              <Text style={styles.actionButtonText}>Call</Text>
            </AnimatedPressable>

            <AnimatedPressable style={[styles.actionButton, styles.whatsappAction]} onPress={handleGeneralRemind}>
              <Ionicons name="logo-whatsapp" size={20} color="#FFFFFF" />
              <Text style={[styles.actionButtonText, styles.whatsappActionText]}>WhatsApp</Text>
            </AnimatedPressable>
          </View>
        </Card>

        {/* Payment History */}
        <View style={styles.historySection}>
          <Text style={styles.historyTitle}>Payment History</Text>
          {loadingHistory ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: spacing(4) }} />
          ) : history.length === 0 ? (
            <Text style={styles.emptyHistoryText}>No payment records yet.</Text>
          ) : (
            history.map((payment, index) => (
              <PaymentRow
                key={payment.id}
                title={`${payment.monthName} ${payment.year}`}
                subtitle={payment.status === 'Paid' && payment.paidDate ? `Paid on ${new Date(payment.paidDate).toLocaleDateString()}` : `Due ${new Date(payment.dueDate).toLocaleDateString()}`}
                amount={payment.amountDue}
                status={payment.status}
                onMarkPaid={payment.status === 'Paid' || busyPaymentId === payment.id ? undefined : () => handleMarkPaid(payment)}
                onRemind={payment.status === 'Paid' ? undefined : () => handleRemindForMonth(payment)}
                onSendReceipt={payment.status === 'Paid' ? () => handleSendReceipt(payment) : undefined}
                delay={Math.min(index, 6) * 40}
              />
            ))
          )}
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

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: spacing(8),
  },
  largeAvatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing(4),
  },
  largeAvatarText: {
    color: colors.onPrimary,
    fontSize: 34,
    fontWeight: '800',
  },
  studentName: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  schoolNameText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  detailsCard: {
    marginHorizontal: spacing(5),
    marginBottom: spacing(6),
  },
  section: {
    marginBottom: spacing(4),
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing(4),
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing(4),
  },
  detailIconContainer: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing(3),
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: colors.textTertiary,
    fontWeight: '600',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing(4),
  },
  actionsSection: {
    flexDirection: 'row',
    gap: spacing(3),
    paddingTop: spacing(2),
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing(3),
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    flex: 1,
    gap: spacing(1.5),
  },
  whatsappAction: {
    backgroundColor: '#25D366',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  whatsappActionText: {
    color: colors.white,
  },
  historySection: {
    paddingHorizontal: spacing(5),
  },
  historyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing(3),
  },
  emptyHistoryText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing(2),
  },
});

export default StudentDetailScreen;
