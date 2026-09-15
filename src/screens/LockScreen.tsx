import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { FadeInView } from '../components/ui/Animated';
import PinKeypad from '../components/ui/PinKeypad';
import PinDots from '../components/ui/PinDots';
import { ThemeColors, spacing } from '../utils/theme';
import { useAppTheme, useThemedStyles } from '../context/ThemeContext';
import { verifyPin } from '../utils/appLock';

const PIN_LENGTH = 4;

interface LockScreenProps {
  onUnlock: () => void;
}

const LockScreen: React.FC<LockScreenProps> = ({ onUnlock }) => {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const shake = useRef(new Animated.Value(0)).current;

  const tryBiometric = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!hasHardware || !isEnrolled) return;
      setBiometricAvailable(true);
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock App',
        cancelLabel: 'Use PIN instead',
      });
      if (result.success) onUnlock();
    } catch (error) {
      console.error('Biometric auth failed:', error);
    }
  };

  useEffect(() => {
    tryBiometric();
  }, []);

  useEffect(() => {
    if (pin.length === PIN_LENGTH) {
      (async () => {
        const isValid = await verifyPin(pin);
        if (isValid) {
          onUnlock();
        } else {
          setError(true);
          Animated.sequence([
            Animated.timing(shake, { toValue: 1, duration: 60, useNativeDriver: true }),
            Animated.timing(shake, { toValue: -1, duration: 60, useNativeDriver: true }),
            Animated.timing(shake, { toValue: 1, duration: 60, useNativeDriver: true }),
            Animated.timing(shake, { toValue: 0, duration: 60, useNativeDriver: true }),
          ]).start(() => setPin(''));
        }
      })();
    } else {
      setError(false);
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
      <FadeInView style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name="lock-closed" size={28} color={colors.onPrimary} />
        </View>
        <Text style={styles.title}>Enter PIN</Text>
        <Text style={styles.subtitle}>{error ? 'Incorrect PIN, try again' : 'Unlock to view your payment data'}</Text>

        <PinDots length={PIN_LENGTH} filled={pin.length} error={error} shakeX={shake} />

        <PinKeypad
          onKeyPress={handleKeyPress}
          showBiometric={biometricAvailable}
          onBiometricPress={tryBiometric}
        />
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

export default LockScreen;
