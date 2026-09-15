import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { ThemeColors, radius, spacing, shadow } from '../../utils/theme';
import { useThemedStyles } from '../../context/ThemeContext';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  padded?: boolean;
}

const Card: React.FC<CardProps> = ({ children, style, padded = true }) => {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={[styles.card, padded && styles.padded, style]}>
      {children}
    </View>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    ...shadow.flat,
  },
  padded: {
    padding: spacing(4),
  },
});

export default Card;
