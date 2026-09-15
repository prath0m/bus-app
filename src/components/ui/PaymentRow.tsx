import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ThemeColors, radius, spacing } from '../../utils/theme';
import { useThemedStyles } from '../../context/ThemeContext';
import { PaymentStatus } from '../../services/api';
import StatusPill from './StatusPill';
import { AnimatedPressable, FadeInView } from './Animated';

interface PaymentRowProps {
  title: string;
  subtitle?: string;
  amount: number;
  status: PaymentStatus;
  avatarLabel?: string;
  onPress?: () => void;
  onMarkPaid?: () => void;
  onRemind?: () => void;
  onSendReceipt?: () => void;
  delay?: number;
}

const PaymentRow: React.FC<PaymentRowProps> = ({
  title,
  subtitle,
  amount,
  status,
  avatarLabel,
  onPress,
  onMarkPaid,
  onRemind,
  onSendReceipt,
  delay = 0,
}) => {
  const styles = useThemedStyles(createStyles);
  const showActions = status !== 'Paid' ? Boolean(onMarkPaid || onRemind) : Boolean(onSendReceipt);

  const content = (
    <View style={styles.container}>
      <View style={styles.topRow}>
        {avatarLabel ? (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{avatarLabel}</Text>
          </View>
        ) : null}
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
        </View>
        <View style={styles.amountWrap}>
          <Text style={styles.amount}>₹{amount}</Text>
          <StatusPill status={status} size="sm" />
        </View>
      </View>

      {showActions ? (
        <View style={styles.actionsRow}>
          {status === 'Paid' ? (
            onSendReceipt ? (
              <AnimatedPressable onPress={onSendReceipt} style={styles.actionButton}>
                <Text style={styles.actionText}>🧾 Receipt</Text>
              </AnimatedPressable>
            ) : null
          ) : (
            <>
              {onRemind ? (
                <AnimatedPressable onPress={onRemind} style={styles.actionButton}>
                  <Text style={styles.actionText}>💬 Remind</Text>
                </AnimatedPressable>
              ) : null}
              {onMarkPaid ? (
                <AnimatedPressable onPress={onMarkPaid} style={[styles.actionButton, styles.actionButtonPrimary]}>
                  <Text style={[styles.actionText, styles.actionTextPrimary]}>Mark Paid</Text>
                </AnimatedPressable>
              ) : null}
            </>
          )}
        </View>
      ) : null}
    </View>
  );

  return (
    <FadeInView delay={delay}>
      {onPress ? (
        <AnimatedPressable onPress={onPress} scaleTo={0.98}>
          {content}
        </AnimatedPressable>
      ) : (
        content
      )}
    </FadeInView>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing(3.5),
    marginBottom: spacing(3),
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing(3),
  },
  avatarText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 15,
  },
  info: {
    flex: 1,
    marginRight: spacing(2),
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
    marginTop: 2,
  },
  amountWrap: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing(3),
    gap: spacing(2),
  },
  actionButton: {
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(1.5),
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
  },
  actionButtonPrimary: {
    backgroundColor: colors.primary,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  actionTextPrimary: {
    color: colors.onPrimary,
  },
});

export default PaymentRow;
