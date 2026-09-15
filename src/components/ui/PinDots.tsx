import React from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { ThemeColors, spacing } from '../../utils/theme';
import { useThemedStyles } from '../../context/ThemeContext';

interface PinDotsProps {
  length: number;
  filled: number;
  error?: boolean;
  shakeX?: Animated.Value;
}

const PinDots: React.FC<PinDotsProps> = ({ length, filled, error, shakeX }) => {
  const styles = useThemedStyles(createStyles);
  const dots = (
    <View style={styles.row}>
      {Array.from({ length }, (_, i) => (
        <View
          key={i}
          style={[styles.dot, i < filled && styles.dotFilled, error && styles.dotError]}
        />
      ))}
    </View>
  );

  if (!shakeX) return dots;

  const translateX = shakeX.interpolate({ inputRange: [-1, 1], outputRange: [-10, 10] });
  return <Animated.View style={{ transform: [{ translateX }] }}>{dots}</Animated.View>;
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing(3),
    marginBottom: spacing(10),
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.border,
  },
  dotFilled: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dotError: {
    backgroundColor: colors.danger,
    borderColor: colors.danger,
  },
});

export default PinDots;
