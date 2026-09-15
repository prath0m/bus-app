import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { ThemeColors, radius, spacing } from '../../utils/theme';
import { useAppTheme, useThemedStyles } from '../../context/ThemeContext';
import { AnimatedPressable } from './Animated';
import { MonthYear, addMonths, formatMonthYear, monthsInRange } from '../../utils/monthRange';

const DURATION_OPTIONS = [1, 2, 3, 4, 5, 6, 8, 9, 10, 12];
const START_OPTIONS_BEFORE = 3; // let owners back-date a term that already started
const START_OPTIONS_AFTER = 18;

interface TermPickerProps {
  start: MonthYear;
  durationMonths: number;
  onChangeStart: (next: MonthYear) => void;
  onChangeDuration: (next: number) => void;
  previewAmount?: number;
}

const TermPicker: React.FC<TermPickerProps> = ({ start, durationMonths, onChangeStart, onChangeDuration, previewAmount }) => {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  const today: MonthYear = { year: new Date().getFullYear(), month: new Date().getMonth() + 1 };
  const startOptions = Array.from(
    { length: START_OPTIONS_BEFORE + START_OPTIONS_AFTER },
    (_, i) => addMonths(today, i - START_OPTIONS_BEFORE)
  );

  const months = monthsInRange(start, durationMonths);
  const endLabel = formatMonthYear(months[months.length - 1]);
  const perMonth = previewAmount ? Math.round(previewAmount / durationMonths) : null;

  return (
    <View>
      <Text style={styles.label}>Starts</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll} contentContainerStyle={styles.chipsRow}>
        {startOptions.map((option) => {
          const isActive = option.year === start.year && option.month === start.month;
          return (
            <AnimatedPressable
              key={`${option.year}-${option.month}`}
              onPress={() => onChangeStart(option)}
              style={[styles.chip, isActive && styles.chipActive]}
              scaleTo={0.92}
            >
              <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{formatMonthYear(option)}</Text>
            </AnimatedPressable>
          );
        })}
      </ScrollView>

      <Text style={[styles.label, { marginTop: spacing(4) }]}>Duration</Text>
      <View style={styles.durationRow}>
        {DURATION_OPTIONS.map((n) => {
          const isActive = n === durationMonths;
          return (
            <AnimatedPressable
              key={n}
              onPress={() => onChangeDuration(n)}
              style={[styles.chip, isActive && styles.chipActive]}
              scaleTo={0.92}
            >
              <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{n} mo</Text>
            </AnimatedPressable>
          );
        })}
      </View>

      <View style={styles.summary}>
        <Text style={styles.summaryText}>
          {formatMonthYear(start)} → {endLabel} · {durationMonths} month{durationMonths === 1 ? '' : 's'}
        </Text>
        {perMonth !== null && (
          <Text style={styles.summaryAmount}>≈ ₹{perMonth} / month</Text>
        )}
      </View>
    </View>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: spacing(2),
  },
  chipsScroll: {
    flexGrow: 0,
    flexShrink: 0,
  },
  chipsRow: {
    gap: spacing(2),
    paddingBottom: spacing(1),
  },
  durationRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing(2),
  },
  chip: {
    paddingHorizontal: spacing(3.5),
    paddingVertical: spacing(2.5),
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
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
  summary: {
    marginTop: spacing(4),
    padding: spacing(3.5),
    borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
  },
  summaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  summaryAmount: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 2,
  },
});

export default TermPicker;
