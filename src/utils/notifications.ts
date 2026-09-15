import { LogBox, Platform } from 'react-native';

// expo-notifications auto-registers a device push token listener as soon as
// it's imported, which logs this as a hard console.error on Android inside
// Expo Go (push notifications were removed from Expo Go in SDK 53 — a
// development build wouldn't show it). It's just noise: none of this app's
// local notification features touch push/remote tokens. Silence only this
// specific message, before the import below triggers it, so real errors
// still surface normally.
LogBox.ignoreLogs(['expo-notifications: Android Push notifications']);

import * as Notifications from 'expo-notifications';
import { getLastOverdueNotifyDate, setLastOverdueNotifyDate } from './preferences';

// Local notifications only — there is no backend push server, so a fully
// background-accurate "3 payments overdue" alert while the app is closed
// isn't possible. This covers it with (a) a generic repeating day-of-month
// reminder and (b) an accurate immediate notification fired whenever the
// app is opened and overdue payments are found.

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const MONTHLY_REMINDER_ID = 'monthly-payment-reminder';

export const requestNotificationPermission = async (): Promise<boolean> => {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Payment reminders',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    return finalStatus === 'granted';
  } catch (error) {
    console.error('Failed to request notification permission:', error);
    return false;
  }
};

export const scheduleMonthlyReminder = async (dayOfMonth: number, hour: number): Promise<void> => {
  await Notifications.cancelScheduledNotificationAsync(MONTHLY_REMINDER_ID).catch(() => {});

  await Notifications.scheduleNotificationAsync({
    identifier: MONTHLY_REMINDER_ID,
    content: {
      title: 'Check this month’s bus payments',
      body: 'Open the app to review who has paid and send reminders.',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      day: dayOfMonth,
      hour,
      minute: 0,
      repeats: true,
    },
  });
};

export const cancelMonthlyReminder = async (): Promise<void> => {
  await Notifications.cancelScheduledNotificationAsync(MONTHLY_REMINDER_ID).catch(() => {});
};

// Fires at most once per day, only when the app is actually opened and the
// dashboard finds overdue students — this is what keeps the count accurate.
export const notifyOverdueSummaryOncePerDay = async (overdueCount: number): Promise<void> => {
  if (overdueCount <= 0) return;

  const today = new Date().toISOString().split('T')[0];
  const lastNotified = await getLastOverdueNotifyDate();
  if (lastNotified === today) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: `${overdueCount} payment${overdueCount === 1 ? '' : 's'} overdue`,
      body: 'Tap to open the Payments tab and send reminders.',
    },
    trigger: null,
  });

  await setLastOverdueNotifyDate(today);
};
