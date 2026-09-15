// Local, per-device owner preferences (WhatsApp template, reminder settings).
// Stored with AsyncStorage the same way the auth token already is in
// src/services/api.ts — this is a single-owner app, so there's no need for
// a backend model just to persist these.
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  whatsappTemplate: 'pref_whatsapp_template',
  reminderEnabled: 'pref_reminder_enabled',
  reminderDay: 'pref_reminder_day',
  reminderHour: 'pref_reminder_hour',
  lastOverdueNotifyDate: 'pref_last_overdue_notify_date',
  themeMode: 'pref_theme_mode',
};

export type ThemeMode = 'system' | 'light' | 'dark';

export const getThemeMode = async (): Promise<ThemeMode> => {
  const stored = await AsyncStorage.getItem(KEYS.themeMode);
  return (stored as ThemeMode) ?? 'system';
};

export const setThemeMode = async (mode: ThemeMode): Promise<void> => {
  await AsyncStorage.setItem(KEYS.themeMode, mode);
};

export const DEFAULT_WHATSAPP_TEMPLATE =
  'Hi {name}, this is a friendly reminder that your bus fee of ₹{amount} for {month} {year} is due. Please make the payment at your earliest convenience. Thank you! - {ownerName}';

export const getWhatsAppTemplate = async (): Promise<string> => {
  const stored = await AsyncStorage.getItem(KEYS.whatsappTemplate);
  return stored ?? DEFAULT_WHATSAPP_TEMPLATE;
};

export const setWhatsAppTemplate = async (template: string): Promise<void> => {
  await AsyncStorage.setItem(KEYS.whatsappTemplate, template);
};

export interface ReminderSettings {
  enabled: boolean;
  dayOfMonth: number;
  hour: number;
}

export const getReminderSettings = async (): Promise<ReminderSettings> => {
  const [enabled, day, hour] = await Promise.all([
    AsyncStorage.getItem(KEYS.reminderEnabled),
    AsyncStorage.getItem(KEYS.reminderDay),
    AsyncStorage.getItem(KEYS.reminderHour),
  ]);

  return {
    enabled: enabled === 'true',
    dayOfMonth: day ? parseInt(day, 10) : 5,
    hour: hour ? parseInt(hour, 10) : 9,
  };
};

export const setReminderSettings = async (settings: ReminderSettings): Promise<void> => {
  await AsyncStorage.setItem(KEYS.reminderEnabled, String(settings.enabled));
  await AsyncStorage.setItem(KEYS.reminderDay, String(settings.dayOfMonth));
  await AsyncStorage.setItem(KEYS.reminderHour, String(settings.hour));
};

export const getLastOverdueNotifyDate = async (): Promise<string | null> => {
  return AsyncStorage.getItem(KEYS.lastOverdueNotifyDate);
};

export const setLastOverdueNotifyDate = async (isoDate: string): Promise<void> => {
  await AsyncStorage.setItem(KEYS.lastOverdueNotifyDate, isoDate);
};
