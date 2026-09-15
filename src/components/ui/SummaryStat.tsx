import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeColors, radius, spacing } from '../../utils/theme';
import { useThemedStyles } from '../../context/ThemeContext';
import { FadeInView } from './Animated';

interface SummaryStatProps {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  tintSoft: string;
  delay?: number;
}

const SummaryStat: React.FC<SummaryStatProps> = ({ label, value, icon, tint, tintSoft, delay = 0 }) => {
  const styles = useThemedStyles(createStyles);
  return (
    <FadeInView style={styles.card} delay={delay}>
      <View style={[styles.iconWrap, { backgroundColor: tintSoft }]}>
        <Ionicons name={icon} size={18} color={tint} />
      </View>
      <Text style={styles.value} numberOfLines={1}>{value}</Text>
      <Text style={styles.label} numberOfLines={1}>{label}</Text>
    </FadeInView>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing(3.5),
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing(2.5),
  },
  value: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 2,
  },
});

export default SummaryStat;
