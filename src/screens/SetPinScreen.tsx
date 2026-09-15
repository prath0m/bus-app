import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FadeInView, AnimatedPressable } from '../components/ui/Animated';
import PinKeypad from '../components/ui/PinKeypad';
import PinDots from '../components/ui/PinDots';
import { ThemeColors, spacing } from '../utils/theme';
import { useAppTheme, useThemedStyles } from '../context/ThemeContext';
import { enableAppLock } from '../utils/appLock';

const PIN_LENGTH = 4;

interface SetPinScreenProps {
  onDone: () => void;
  onCancel: () => void;
}

const SetPinScreen: React.FC<SetPinScreenProps> = ({ onDone, onCancel }) => {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const [stage, setStage] = useState<'create' | 'confirm'>('create');
  const [firstPin, setFirstPin] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const shake = useRef(new Animated.Value(0)).current;

  const runShake = (onFinished: () => void) => {
    Animated.sequence([
      Animated.timing(shake, { toValue: 1, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -1, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 1, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start(onFinished);
  };

  useEffect(() => {
    if (pin.length !== PIN_LENGTH) {
      setError(false);
      return;
    }

    if (stage === 'create') {
      setFirstPin(pin);
      setStage('confirm');
      setPin('');
    } else {
      if (pin === firstPin) {
        (async () => {
          await enableAppLock(pin);
          onDone();
        })();
      } else {
        setError(true);
        runShake(() => {
          setStage('create');
          setFirstPin('');
          setPin('');
        });
      }
    }
  }, [pin]);

  const handleKeyPress = (key: string) => {
    if (key === 'back') {
      setPin((p) => p.slice(0, -1));
    } else if (pin.length < PIN_LENGTH) {
      setPin((p) => p + key);
    }
  };

  return (
    <View style={styles.container}>
      <AnimatedPressable style={styles.cancelButton} onPress={onCancel}>
        <Ionicons name="close" size={22} color={colors.textPrimary} />
      </AnimatedPressable>

      <FadeInView style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name="lock-closed" size={28} color={colors.onPrimary} />
        </View>
        <Text style={styles.title}>{stage === 'create' ? 'Create a PIN' : 'Confirm PIN'}</Text>
        <Text style={styles.subtitle}>
          {error ? "PINs didn't match, try again" : stage === 'create' ? 'Used to unlock the app' : 'Enter it once more'}
        </Text>

        <PinDots length={PIN_LENGTH} filled={pin.length} error={error} shakeX={shake} />

        <PinKeypad onKeyPress={handleKeyPress} />
      </FadeInView>
    </View>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    position: 'absolute',
    top: 56,
    right: spacing(5),
    padding: spacing(2),
  },
  content: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: spacing(8),
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing(5),
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing(1.5),
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: spacing(8),
    textAlign: 'center',
  },
});

export default SetPinScreen;
