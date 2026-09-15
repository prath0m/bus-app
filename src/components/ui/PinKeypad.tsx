import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeColors, spacing } from '../../utils/theme';
import { useAppTheme, useThemedStyles } from '../../context/ThemeContext';
import { AnimatedPressable } from './Animated';

const KEYPAD_ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['bio', '0', 'back'],
];

interface PinKeypadProps {
  onKeyPress: (key: string) => void;
  showBiometric?: boolean;
  onBiometricPress?: () => void;
}

const PinKeypad: React.FC<PinKeypadProps> = ({ onKeyPress, showBiometric, onBiometricPress }) => {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.keypad}>
      {KEYPAD_ROWS.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.keypadRow}>
          {row.map((key) => {
            if (key === 'bio') {
              if (!showBiometric) return <View key={key} style={styles.key} />;
              return (
                <AnimatedPressable key={key} style={styles.key} onPress={onBiometricPress}>
                  <Ionicons name="finger-print-outline" size={24} color={colors.primary} />
                </AnimatedPressable>
              );
            }
            return (
              <AnimatedPressable key={key} style={styles.key} onPress={() => onKeyPress(key)}>
                {key === 'back' ? (
                  <Ionicons name="backspace-outline" size={22} color={colors.textPrimary} />
                ) : (
                  <Text style={styles.keyText}>{key}</Text>
                )}
              </AnimatedPressable>
            );
          })}
        </View>
      ))}
    </View>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  keypad: {
    width: '100%',
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing(4),
  },
  key: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  keyText: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
  },
});

export default PinKeypad;
