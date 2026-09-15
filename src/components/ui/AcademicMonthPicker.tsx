import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeColors, radius, spacing } from '../../utils/theme';
import { useAppTheme, useThemedStyles } from '../../context/ThemeContext';
import { AcademicMonth, getAcademicMonths, getAcademicYearLabel, isSameAcademicMonth } from '../../utils/academicYear';
import { AnimatedPressable } from './Animated';

const SHORT_MONTH_NAMES = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];

interface AcademicMonthPickerProps {
  startYear: number;
  selected: AcademicMonth;
  onSelectYear: (startYear: number) => void;
  onSelectMonth: (month: AcademicMonth) => void;
}

const AcademicMonthPicker: React.FC<AcademicMonthPickerProps> = ({ startYear, selected, onSelectYear, onSelectMonth }) => {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const months = getAcademicMonths(startYear);

  return (
    <View>
      <View style={styles.yearRow}>
        <AnimatedPressable onPress={() => onSelectYear(startYear - 1)} style={styles.yearArrow}>
          <Ionicons name="chevron-back" size={18} color={colors.textPrimary} />
        </AnimatedPressable>
        <Text style={styles.yearLabel}>Academic Year {getAcademicYearLabel(startYear)}</Text>
        <AnimatedPressable onPress={() => onSelectYear(startYear + 1)} style={styles.yearArrow}>
          <Ionicons name="chevron-forward" size={18} color={colors.textPrimary} />
        </AnimatedPressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipsScroll}
        contentContainerStyle={styles.chipsRow}
      >
        {months.map((m, index) => {
          const isActive = isSameAcademicMonth(m, selected);
          return (
            <AnimatedPressable
              key={`${m.year}-${m.month}`}
              onPress={() => onSelectMonth(m)}
              style={[styles.chip, isActive && styles.chipActive]}
              scaleTo={0.9}
            >
              <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{SHORT_MONTH_NAMES[index]}</Text>
            </AnimatedPressable>
          );
        })}
      </ScrollView>
    </View>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  yearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing(3),
  },
  yearArrow: {
    padding: spacing(2),
  },
  yearLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginHorizontal: spacing(3),
  },
  chipsScroll: {
    flexGrow: 0,
    flexShrink: 0,
  },
  chipsRow: {
    paddingHorizontal: spacing(5),
    paddingBottom: spacing(3),
    gap: spacing(2),
  },
  chip: {
    paddingHorizontal: spacing(3.5),
    paddingVertical: spacing(2.5),
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    marginRight: spacing(2),
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
});

export default AcademicMonthPicker;
