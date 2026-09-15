import React from 'react';
import { Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeColors, radius, spacing } from '../../utils/theme';
import { useAppTheme, useThemedStyles } from '../../context/ThemeContext';
import { AnimatedPressable } from './Animated';

interface ButtonProps {
  title: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle | ViewStyle[];
  compact?: boolean;
}

export const PrimaryButton: React.FC<ButtonProps> = ({ title, onPress, icon, loading, disabled, style, compact }) => {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.base, styles.primary, compact && styles.compact, (disabled || loading) && styles.disabled, style]}
    >
      {loading ? (
        <ActivityIndicator color={colors.onPrimary} size="small" />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={17} color={colors.onPrimary} style={styles.icon} /> : null}
          <Text style={styles.primaryText}>{title}</Text>
        </>
      )}
    </AnimatedPressable>
  );
};

export const SecondaryButton: React.FC<ButtonProps> = ({ title, onPress, icon, loading, disabled, style, compact }) => {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.base, styles.secondary, compact && styles.compact, (disabled || loading) && styles.disabled, style]}
    >
      {loading ? (
        <ActivityIndicator color={colors.primary} size="small" />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={17} color={colors.primary} style={styles.icon} /> : null}
          <Text style={styles.secondaryText}>{title}</Text>
        </>
      )}
    </AnimatedPressable>
  );
};

export const WhatsAppButton: React.FC<ButtonProps> = ({ title, onPress, disabled, style, compact }) => {
  const styles = useThemedStyles(createStyles);
  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.base, styles.whatsapp, compact && styles.compact, disabled && styles.disabled, style]}
    >
      <Ionicons name="logo-whatsapp" size={17} color="#FFFFFF" style={styles.icon} />
      <Text style={styles.whatsappText}>{title}</Text>
    </AnimatedPressable>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing(3.5),
    paddingHorizontal: spacing(4),
    borderRadius: radius.pill,
  },
  compact: {
    paddingVertical: spacing(2),
    paddingHorizontal: spacing(3),
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.primarySoft,
  },
  whatsapp: {
    backgroundColor: '#25D366',
  },
  disabled: {
    opacity: 0.5,
  },
  icon: {
    marginRight: spacing(1.5),
  },
  primaryText: {
    color: colors.onPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '700',
  },
  whatsappText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
