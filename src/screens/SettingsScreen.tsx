import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  BackHandler,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenHeader from '../components/ui/ScreenHeader';
import Card from '../components/ui/Card';
import { AnimatedPressable, FadeInView } from '../components/ui/Animated';
import { ThemeColors, radius, spacing } from '../utils/theme';
import { useAppTheme, useThemedStyles } from '../context/ThemeContext';
import { ThemeMode } from '../utils/preferences';
import {
  DEFAULT_WHATSAPP_TEMPLATE,
  getReminderSettings,
  getWhatsAppTemplate,
  setReminderSettings,
  setWhatsAppTemplate,
} from '../utils/preferences';
import { cancelMonthlyReminder, requestNotificationPermission, scheduleMonthlyReminder } from '../utils/notifications';
import { isAppLockEnabled, disableAppLock } from '../utils/appLock';
import SetPinScreen from './SetPinScreen';

interface SettingsScreenProps {
  onBack: () => void;
}

const DAY_OPTIONS = [1, 5, 10, 15, 20, 25];
const HOUR_OPTIONS = [8, 9, 12, 18, 20];

const THEME_OPTIONS: { value: ThemeMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'system', label: 'System', icon: 'phone-portrait-outline' },
  { value: 'light', label: 'Light', icon: 'sunny-outline' },
  { value: 'dark', label: 'Dark', icon: 'moon-outline' },
];

const SettingsScreen: React.FC<SettingsScreenProps> = ({ onBack }) => {
  const { colors, mode, setMode } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderDay, setReminderDay] = useState(5);
  const [reminderHour, setReminderHour] = useState(9);
  const [template, setTemplate] = useState(DEFAULT_WHATSAPP_TEMPLATE);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [appLockEnabled, setAppLockEnabled] = useState(false);
  const [showSetPin, setShowSetPin] = useState(false);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      onBack();
      return true;
    });

    return () => backHandler.remove();
  }, []);

  useEffect(() => {
    (async () => {
      const settings = await getReminderSettings();
      setReminderEnabled(settings.enabled);
      setReminderDay(settings.dayOfMonth);
      setReminderHour(settings.hour);

      const savedTemplate = await getWhatsAppTemplate();
      setTemplate(savedTemplate);

      setAppLockEnabled(await isAppLockEnabled());
    })();
  }, []);

  const handleToggleAppLock = async (value: boolean) => {
    if (value) {
      setShowSetPin(true);
    } else {
      Alert.alert(
        'Turn off App Lock?',
        'Anyone with this phone will be able to open the app without a PIN.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Turn Off',
            style: 'destructive',
            onPress: async () => {
              await disableAppLock();
              setAppLockEnabled(false);
            },
          },
        ]
      );
    }
  };

  const persistReminderSettings = async (enabled: boolean, day: number, hour: number) => {
    await setReminderSettings({ enabled, dayOfMonth: day, hour });
    if (enabled) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        Alert.alert('Notifications disabled', 'Enable notification permission in device settings to receive reminders.');
        return;
      }
      await scheduleMonthlyReminder(day, hour);
    } else {
      await cancelMonthlyReminder();
    }
  };

  const handleToggleReminder = async (value: boolean) => {
    setReminderEnabled(value);
    await persistReminderSettings(value, reminderDay, reminderHour);
  };

  const handleSelectDay = async (day: number) => {
    setReminderDay(day);
    if (reminderEnabled) await persistReminderSettings(true, day, reminderHour);
  };

  const handleSelectHour = async (hour: number) => {
    setReminderHour(hour);
    if (reminderEnabled) await persistReminderSettings(true, reminderDay, hour);
  };

  const handleSaveTemplate = async () => {
    try {
      setSavingTemplate(true);
      await setWhatsAppTemplate(template);
      Alert.alert('Saved', 'Your WhatsApp reminder message has been updated.');
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleResetTemplate = () => {
    setTemplate(DEFAULT_WHATSAPP_TEMPLATE);
  };

  if (showSetPin) {
    return (
      <SetPinScreen
        onDone={() => {
          setShowSetPin(false);
          setAppLockEnabled(true);
        }}
        onCancel={() => setShowSetPin(false)}
      />
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="Settings" onBack={onBack} />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Appearance Section */}
        <FadeInView delay={0}>
        <Text style={styles.sectionLabel}>Appearance</Text>
        <Card style={styles.card}>
          <View style={styles.segmentRow}>
            {THEME_OPTIONS.map((option) => {
              const isActive = mode === option.value;
              return (
                <AnimatedPressable
                  key={option.value}
                  onPress={() => setMode(option.value)}
                  style={[styles.segment, isActive && styles.segmentActive]}
                >
                  <Ionicons name={option.icon} size={16} color={isActive ? colors.onPrimary : colors.textSecondary} />
                  <Text style={[styles.segmentText, isActive && styles.segmentTextActive]}>{option.label}</Text>
                </AnimatedPressable>
              );
            })}
          </View>
        </Card>
        </FadeInView>

        {/* Security Section */}
        <FadeInView delay={30}>
        <Text style={styles.sectionLabel}>Security</Text>
        <Card style={styles.card}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>App Lock</Text>
              <Text style={styles.rowSubtitle}>Require a PIN or fingerprint to open the app</Text>
            </View>
            <Switch
              value={appLockEnabled}
              onValueChange={handleToggleAppLock}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={appLockEnabled ? colors.onPrimary : colors.surface}
            />
          </View>

          {appLockEnabled && (
            <>
              <View style={styles.divider} />
              <AnimatedPressable style={styles.linkRow} onPress={() => setShowSetPin(true)}>
                <Text style={styles.linkRowText}>Change PIN</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
              </AnimatedPressable>
            </>
          )}
        </Card>
        </FadeInView>

        {/* Reminders Section */}
        <FadeInView delay={60}>
        <Text style={styles.sectionLabel}>Reminders</Text>
        <Card style={styles.card}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Monthly payment reminder</Text>
              <Text style={styles.rowSubtitle}>Get a local notification to check dues each month</Text>
            </View>
            <Switch
              value={reminderEnabled}
              onValueChange={handleToggleReminder}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={reminderEnabled ? colors.onPrimary : colors.surface}
            />
          </View>

          {reminderEnabled && (
            <>
              <View style={styles.divider} />
              <Text style={styles.miniLabel}>Day of month</Text>
              <View style={styles.chipRow}>
                {DAY_OPTIONS.map((day) => (
                  <AnimatedPressable
                    key={day}
                    style={[styles.chip, reminderDay === day && styles.chipActive]}
                    onPress={() => handleSelectDay(day)}
                  >
                    <Text style={[styles.chipText, reminderDay === day && styles.chipTextActive]}>{day}</Text>
                  </AnimatedPressable>
                ))}
              </View>

              <Text style={[styles.miniLabel, { marginTop: spacing(4) }]}>Time</Text>
              <View style={styles.chipRow}>
                {HOUR_OPTIONS.map((hour) => (
                  <AnimatedPressable
                    key={hour}
                    style={[styles.chip, reminderHour === hour && styles.chipActive]}
                    onPress={() => handleSelectHour(hour)}
                  >
                    <Text style={[styles.chipText, reminderHour === hour && styles.chipTextActive]}>
                      {hour % 12 === 0 ? 12 : hour % 12}:00 {hour >= 12 ? 'PM' : 'AM'}
                    </Text>
                  </AnimatedPressable>
                ))}
              </View>
            </>
          )}
        </Card>
        </FadeInView>

        {/* WhatsApp Template Section */}
        <FadeInView delay={120}>
        <Text style={styles.sectionLabel}>WhatsApp Reminder Message</Text>
        <Card style={styles.card}>
          <Text style={styles.rowSubtitle}>
            Placeholders: {'{name}'} {'{amount}'} {'{month}'} {'{year}'} {'{ownerName}'}
          </Text>
          <TextInput
            style={styles.templateInput}
            value={template}
            onChangeText={setTemplate}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
          <View style={styles.templateActions}>
            <AnimatedPressable style={styles.resetButton} onPress={handleResetTemplate}>
              <Text style={styles.resetButtonText}>Reset to Default</Text>
            </AnimatedPressable>
            <AnimatedPressable style={styles.saveButton} onPress={handleSaveTemplate} disabled={savingTemplate}>
              <Text style={styles.saveButtonText}>{savingTemplate ? 'Saving...' : 'Save'}</Text>
            </AnimatedPressable>
          </View>
        </Card>
        </FadeInView>

        {/* About Section */}
        <FadeInView delay={180}>
        <Text style={styles.sectionLabel}>About</Text>
        <Card style={styles.card}>
          <View style={styles.aboutRow}>
            <Ionicons name="bus-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.aboutText}>School Bus Payment Tracker · v1.0.0</Text>
          </View>
          <View style={styles.aboutRow}>
            <Ionicons name="shield-checkmark-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.aboutText}>JWT-secured, MongoDB-backed</Text>
          </View>
        </Card>
        </FadeInView>
      </ScrollView>
    </View>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: spacing(2),
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing(2.5),
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    gap: spacing(1.5),
  },
  segmentActive: {
    backgroundColor: colors.primary,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  segmentTextActive: {
    color: colors.onPrimary,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing(5),
    paddingBottom: 60,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing(2),
    marginTop: spacing(5),
  },
  card: {
    marginBottom: spacing(2),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  rowSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing(4),
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  linkRowText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  miniLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textTertiary,
    marginBottom: spacing(2),
    textTransform: 'uppercase',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing(2),
  },
  chip: {
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(2),
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
  },
  chipActive: {
    backgroundColor: colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.onPrimary,
  },
  templateInput: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.sm,
    padding: spacing(3),
    marginTop: spacing(3),
    fontSize: 14,
    color: colors.textPrimary,
    minHeight: 110,
  },
  templateActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing(2),
    marginTop: spacing(3),
  },
  resetButton: {
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(2.5),
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
  },
  resetButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  saveButton: {
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(2.5),
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  saveButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.onPrimary,
  },
  aboutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing(2),
    gap: spacing(3),
  },
  aboutText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
});

export default SettingsScreen;
