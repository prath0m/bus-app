import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  ActivityIndicator,
  BackHandler,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { parentAPI, ParentChild, BusInfo, HomeLocation, Payment, User } from '../services/api';
import { AnimatedPressable, FadeInView } from '../components/ui/Animated';
import { PrimaryButton, SecondaryButton } from '../components/ui/Buttons';
import Card from '../components/ui/Card';
import StatusPill from '../components/ui/StatusPill';
import EmptyState from '../components/ui/EmptyState';
import { ThemeColors, radius, spacing } from '../utils/theme';
import { useAppTheme, useThemedStyles } from '../context/ThemeContext';
import { formatAgo } from '../utils/geo';
import { ParentMapMode } from './ParentMapScreen';

// The bus card only needs a rough "is it moving" — the map polls faster
const BUS_POLL_INTERVAL_MS = 15000;

interface ParentHomeScreenProps {
  user: User;
  homeLocation: HomeLocation | null;
  onHomeLocationLoaded: (home: HomeLocation | null) => void;
  onOpenMap: (mode: ParentMapMode) => void;
  onLogout: () => void;
}

const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

const ParentHomeScreen: React.FC<ParentHomeScreenProps> = ({
  user,
  homeLocation,
  onHomeLocationLoaded,
  onOpenMap,
  onLogout,
}) => {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  const [children, setChildren] = useState<ParentChild[]>([]);
  const [buses, setBuses] = useState<BusInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [history, setHistory] = useState<Record<string, Payment[]>>({});
  const [loadingHistoryId, setLoadingHistoryId] = useState<string | null>(null);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => backHandler.remove();
  }, []);

  const loadChildren = useCallback(async () => {
    try {
      const data = await parentAPI.getChildren();
      setChildren(data.children);
      onHomeLocationLoaded(data.homeLocation);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to load your children');
    }
  }, [onHomeLocationLoaded]);

  const loadBuses = useCallback(async () => {
    try {
      setBuses(await parentAPI.getBusLocations());
    } catch (error) {
      console.error('Failed to load bus status:', error);
    }
  }, []);

  useEffect(() => {
    Promise.all([loadChildren(), loadBuses()]).finally(() => setLoading(false));
    const id = setInterval(loadBuses, BUS_POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    setHistory({});
    await Promise.all([loadChildren(), loadBuses()]);
    setRefreshing(false);
  };

  const toggleChild = async (childId: string) => {
    if (expandedId === childId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(childId);
    if (history[childId]) return;
    setLoadingHistoryId(childId);
    try {
      const payments = await parentAPI.getChildPayments(childId);
      setHistory((prev) => ({ ...prev, [childId]: payments }));
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to load payment history');
    } finally {
      setLoadingHistoryId(null);
    }
  };

  const confirmLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: onLogout },
    ]);
  };

  const liveBus = buses.find((b) => b.location?.isLive);
  const primaryBus = liveBus ?? buses.find((b) => b.location) ?? buses[0];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.flex}>
          <Text style={styles.greeting}>Hi, {user.firstName}</Text>
          <Text style={styles.subGreeting}>Here's your child's bus & fees</Text>
        </View>
        <AnimatedPressable style={styles.iconButton} onPress={confirmLogout}>
          <Ionicons name="log-out-outline" size={24} color={colors.textPrimary} />
        </AnimatedPressable>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.textSecondary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.textSecondary} />}
        >
          {/* Bus status */}
          <FadeInView>
            <AnimatedPressable style={styles.busCard} onPress={() => onOpenMap('track')} scaleTo={0.98}>
              <View style={styles.busRow}>
                <View style={styles.busIcon}>
                  <Ionicons name="bus" size={26} color={colors.primary} />
                </View>
                <View style={styles.flex}>
                  <View style={styles.liveRow}>
                    <View style={[styles.liveDot, { backgroundColor: liveBus ? colors.success : colors.textTertiary }]} />
                    <Text style={styles.busStatus}>{liveBus ? 'Bus is live' : 'Bus is offline'}</Text>
                  </View>
                  <Text style={styles.busMeta} numberOfLines={1}>
                    {liveBus?.location
                      ? `Updated ${formatAgo(liveBus.location.updatedAt)}`
                      : primaryBus?.location
                        ? `Last seen ${formatAgo(primaryBus.location.updatedAt)}`
                        : 'Tracking starts when the driver begins the trip'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={22} color={colors.onPrimary} />
              </View>
              {primaryBus && (
                <View style={styles.driverRow}>
                  <Text style={styles.driverName} numberOfLines={1}>Driver: {primaryBus.owner.name}</Text>
                  <AnimatedPressable
                    style={styles.callButton}
                    onPress={() => Linking.openURL(`tel:${primaryBus.owner.mobileNumber}`)}
                  >
                    <Ionicons name="call" size={14} color={colors.primary} />
                    <Text style={styles.callText}>Call</Text>
                  </AnimatedPressable>
                </View>
              )}
            </AnimatedPressable>
          </FadeInView>

          {/* Home location */}
          <FadeInView delay={60}>
            <Card style={styles.section}>
              <View style={styles.homeRow}>
                <View style={[styles.homeIcon, { backgroundColor: homeLocation ? colors.successSoft : colors.warningSoft }]}>
                  <Ionicons name="home" size={20} color={homeLocation ? colors.success : colors.warning} />
                </View>
                <View style={styles.flex}>
                  <Text style={styles.cardTitle}>Home location</Text>
                  <Text style={styles.cardSubtitle} numberOfLines={2}>
                    {homeLocation
                      ? homeLocation.address || 'Pin saved on map'
                      : 'Not set — the driver needs it for pickup and drop.'}
                  </Text>
                </View>
              </View>
              {homeLocation ? (
                <SecondaryButton title="Change home location" icon="map" onPress={() => onOpenMap('setHome')} compact />
              ) : (
                <PrimaryButton title="Set home location" icon="location" onPress={() => onOpenMap('setHome')} />
              )}
            </Card>
          </FadeInView>

          <Text style={styles.sectionTitle}>My children</Text>

          {children.length === 0 ? (
            <EmptyState
              icon="people"
              title="No children linked"
              subtitle={`Ask your bus owner to add ${user.mobileNumber} as your child's contact number.`}
            />
          ) : (
            children.map((child, index) => {
              const expanded = expandedId === child.id;
              const payments = history[child.id];
              return (
                <FadeInView key={child.id} delay={120 + index * 60}>
                  <Card style={styles.section}>
                    <AnimatedPressable onPress={() => toggleChild(child.id)} scaleTo={0.99}>
                      <View style={styles.childRow}>
                        <View style={styles.avatar}>
                          <Text style={styles.avatarText}>{child.name.charAt(0).toUpperCase()}</Text>
                        </View>
                        <View style={styles.flex}>
                          <Text style={styles.cardTitle}>{child.name}</Text>
                          {child.school && (
                            <Text style={styles.cardSubtitle} numberOfLines={1}>
                              {child.school.schoolName} · {child.school.shift} {child.school.timing}
                            </Text>
                          )}
                        </View>
                        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color={colors.textTertiary} />
                      </View>

                      <View style={styles.feeRow}>
                        <View style={styles.flex}>
                          <Text style={styles.feeLabel}>
                            This month{child.currentPayment ? ` (${child.currentPayment.monthName})` : ''}
                          </Text>
                          <Text style={styles.feeAmount}>
                            {formatCurrency(child.currentPayment?.amountDue ?? child.paymentAmount)}
                          </Text>
                        </View>
                        {child.currentPayment && <StatusPill status={child.currentPayment.status} />}
                      </View>

                      {child.outstanding > 0 && (
                        <View style={styles.outstanding}>
                          <Ionicons name="alert-circle" size={16} color={colors.danger} />
                          <Text style={styles.outstandingText}>
                            {formatCurrency(child.outstanding)} pending in total
                          </Text>
                        </View>
                      )}
                    </AnimatedPressable>

                    {expanded && (
                      <View style={styles.history}>
                        <Text style={styles.historyTitle}>Payment history</Text>
                        {loadingHistoryId === child.id ? (
                          <ActivityIndicator color={colors.textSecondary} style={styles.historyLoader} />
                        ) : (
                          (payments ?? []).map((p) => (
                            <View key={p.id} style={styles.historyRow}>
                              <View style={styles.flex}>
                                <Text style={styles.historyMonth}>{p.monthName} {p.year}</Text>
                                <Text style={styles.historyMeta}>
                                  {p.status === 'Paid' && p.paidDate
                                    ? `Paid ${new Date(p.paidDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}${p.paymentMode ? ` · ${p.paymentMode}` : ''}`
                                    : `Due ${new Date(p.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}
                                </Text>
                              </View>
                              <Text style={styles.historyAmount}>{formatCurrency(p.amountDue)}</Text>
                              <StatusPill status={p.status} size="sm" />
                            </View>
                          ))
                        )}
                      </View>
                    )}
                  </Card>
                </FadeInView>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  flex: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 44,
    paddingHorizontal: spacing(5),
    paddingBottom: spacing(3),
  },
  greeting: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  subGreeting: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    marginTop: 2,
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: spacing(5),
    paddingTop: spacing(2),
    paddingBottom: spacing(12),
  },
  busCard: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing(5),
    marginBottom: spacing(4),
  },
  busRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  busIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.onPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing(4),
  },
  liveRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing(2),
  },
  busStatus: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.onPrimary,
  },
  busMeta: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.onPrimary,
    opacity: 0.75,
    marginTop: 3,
  },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing(4),
    paddingTop: spacing(3),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.onPrimary,
  },
  driverName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.onPrimary,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1),
    backgroundColor: colors.onPrimary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(1.5),
  },
  callText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  section: {
    marginBottom: spacing(4),
    gap: spacing(3),
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: spacing(2),
    marginBottom: spacing(3),
  },
  homeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  homeIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing(3),
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  cardSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
    marginTop: 2,
  },
  childRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing(3),
  },
  avatarText: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.primary,
  },
  feeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing(4),
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.sm,
    padding: spacing(3),
  },
  feeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  feeAmount: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 2,
  },
  outstanding: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1.5),
    marginTop: spacing(3),
  },
  outstandingText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.danger,
  },
  history: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing(3),
  },
  historyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: spacing(2),
  },
  historyLoader: {
    paddingVertical: spacing(4),
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(3),
    paddingVertical: spacing(2),
  },
  historyMonth: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  historyMeta: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textTertiary,
    marginTop: 1,
  },
  historyAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
});

export default ParentHomeScreen;
