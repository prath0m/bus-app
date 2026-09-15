import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { radius, spacing, getStatusColors } from '../../utils/theme';
import { useAppTheme } from '../../context/ThemeContext';
import { PaymentStatus } from '../../services/api';

interface StatusPillProps {
  status: PaymentStatus;
  size?: 'sm' | 'md';
}

const StatusPill: React.FC<StatusPillProps> = ({ status, size = 'md' }) => {
  const { colors } = useAppTheme();
  const { fg, bg } = getStatusColors(colors)[status];
  return (
    <View style={[styles.pill, { backgroundColor: bg }, size === 'sm' && styles.pillSm]}>
      <Text style={[styles.text, { color: fg }, size === 'sm' && styles.textSm]}>{status}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(1.5),
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  pillSm: {
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1),
  },
  text: {
    fontSize: 13,
    fontWeight: '700',
  },
  textSm: {
    fontSize: 11,
  },
});

export default StatusPill;
