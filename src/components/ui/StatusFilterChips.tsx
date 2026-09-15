import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ThemeColors, radius, spacing, getStatusColors } from '../../utils/theme';
import { useAppTheme, useThemedStyles } from '../../context/ThemeContext';
import { AnimatedPressable } from './Animated';
import { PaymentStatus } from '../../services/api';

export type StatusFilterValue = 'All' | PaymentStatus;

const OPTIONS: StatusFilterValue[] = ['All', 'Due', 'Overdue', 'Paid'];

interface StatusFilterChipsProps {
  value: StatusFilterValue;
  onChange: (next: StatusFilterValue) => void;
}

const StatusFilterChips: React.FC<StatusFilterChipsProps> = ({ value, onChange }) => {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const statusColors = getStatusColors(colors);

  return (
    <View style={styles.row}>
      {OPTIONS.map((option) => {
        const isActive = value === option;
        const tint = option === 'All' ? colors.primary : statusColors[option].fg;
        return (
          <AnimatedPressable
            key={option}
            onPress={() => onChange(option)}
            style={[styles.chip, isActive && { backgroundColor: tint }]}
            scaleTo={0.92}
          >
            <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{option}</Text>
          </AnimatedPressable>
        );
      })}
    </View>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing(2),
    marginBottom: spacing(4),
  },
  chip: {
    paddingHorizontal: spacing(3.5),
    paddingVertical: spacing(2),
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.onPrimary,
  },
});

export default StatusFilterChips;
