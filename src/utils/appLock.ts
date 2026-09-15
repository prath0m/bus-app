// App lock: a PIN (hashed, never stored in plaintext) with an optional
// biometric (Face ID / fingerprint) shortcut on top of it. Protects the
// student contact numbers and payment records this app holds if the phone
// is shared or left unlocked.
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

const KEYS = {
  enabled: 'pref_app_lock_enabled',
  pinHash: 'pref_app_lock_pin_hash',
};

export const isAppLockEnabled = async (): Promise<boolean> => {
  const stored = await AsyncStorage.getItem(KEYS.enabled);
  return stored === 'true';
};

export const hasPinSet = async (): Promise<boolean> => {
  const hash = await AsyncStorage.getItem(KEYS.pinHash);
  return Boolean(hash);
};

const hashPin = (pin: string): Promise<string> => {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, pin);
};

export const setPin = async (pin: string): Promise<void> => {
  const hash = await hashPin(pin);
  await AsyncStorage.setItem(KEYS.pinHash, hash);
};

export const verifyPin = async (pin: string): Promise<boolean> => {
  const stored = await AsyncStorage.getItem(KEYS.pinHash);
  if (!stored) return false;
  const hash = await hashPin(pin);
  return hash === stored;
};

export const enableAppLock = async (pin: string): Promise<void> => {
  await setPin(pin);
  await AsyncStorage.setItem(KEYS.enabled, 'true');
};

export const disableAppLock = async (): Promise<void> => {
  await AsyncStorage.setItem(KEYS.enabled, 'false');
  await AsyncStorage.removeItem(KEYS.pinHash);
};
