import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator, BackHandler, Platform } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { locationAPI, ParentHome, StudentWithoutHome } from '../services/api';
import BottomNavigation, { TabName } from '../components/BottomNavigation';
import { AnimatedPressable } from '../components/ui/Animated';
import { PrimaryButton, SecondaryButton } from '../components/ui/Buttons';
import { ThemeColors, radius, spacing, shadow } from '../utils/theme';
import { useAppTheme, useThemedStyles } from '../context/ThemeContext';
import {
  getSharingState,
  subscribeToSharing,
  startSharing,
  stopSharing,
  requestForegroundPermission,
  SharingState,
} from '../utils/liveLocation';
import { DEFAULT_REGION, formatAgo } from '../utils/geo';

interface OwnerMapScreenProps {
  onNavigateToHome: () => void;
  onNavigateToPayment: () => void;
  onNavigateToCreate: () => void;
  onNavigateToRoutes: () => void;
  onNavigateToProfile: () => void;
}

const OwnerMapScreen: React.FC<OwnerMapScreenProps> = ({
  onNavigateToHome,
  onNavigateToPayment,
  onNavigateToCreate,
  onNavigateToRoutes,
  onNavigateToProfile,
}) => {
  const activeTab: TabName = 'map';
  const { colors, isDark } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const mapRef = useRef<MapView>(null);

  const [homes, setHomes] = useState<ParentHome[]>([]);
  const [missing, setMissing] = useState<StudentWithoutHome[]>([]);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState<SharingState>(getSharingState());
  const [toggling, setToggling] = useState(false);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  // Re-render every few seconds so "updated Xs ago" stays current
  const [, setTick] = useState(0);

  useEffect(() => subscribeToSharing(setSharing), []);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 5000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    requestForegroundPermission().then(setHasLocationPermission);
  }, []);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      onNavigateToHome();
      return true;
    });
    return () => backHandler.remove();
  }, []);

  const fitToMarkers = useCallback((points: ParentHome[]) => {
    const coords = points.map(({ latitude, longitude }) => ({ latitude, longitude }));
    const own = getSharingState().lastPosition;
    if (own) coords.push(own);
    if (coords.length === 0) return;
    mapRef.current?.fitToCoordinates(coords, {
      edgePadding: { top: 140, right: 60, bottom: 320, left: 60 },
      animated: true,
    });
  }, []);

  const loadHomes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await locationAPI.getParentHomes();
      setHomes(data.homes);
      setMissing(data.missing);
      fitToMarkers(data.homes);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to load home locations');
    } finally {
      setLoading(false);
    }
  }, [fitToMarkers]);

  useEffect(() => {
    loadHomes();
  }, [loadHomes]);

  const handleToggleSharing = async () => {
    setToggling(true);
    try {
      if (sharing.isSharing) {
        await stopSharing();
      } else {
        await startSharing();
        setHasLocationPermission(true);
      }
    } catch (error) {
      Alert.alert('Location', error instanceof Error ? error.message : 'Could not start sharing');
    } finally {
      setToggling(false);
    }
  };

  const showMissing = () => {
    const lines = missing.map((s) =>
      `• ${s.name} — ${s.parentRegistered ? 'parent has not set home yet' : `parent not registered (${s.contactNumber})`}`
    );
    Alert.alert('No home location yet', lines.join('\n'));
  };

  const handleTabPress = (tab: TabName) => {
    switch (tab) {
      case 'home': onNavigateToHome(); break;
      case 'payment': onNavigateToPayment(); break;
      case 'create': onNavigateToCreate(); break;
      case 'routes': onNavigateToRoutes(); break;
      case 'map': break;
      case 'profile': onNavigateToProfile(); break;
    }
  };

  const studentCount = homes.reduce((sum, h) => sum + h.students.length, 0);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={DEFAULT_REGION}
        showsUserLocation={hasLocationPermission}
        showsMyLocationButton={false}
        userInterfaceStyle={isDark ? 'dark' : 'light'}
        onMapReady={() => fitToMarkers(homes)}
      >
        {homes.map((home) => (
          <Marker
            key={home.parentId}
            coordinate={{ latitude: home.latitude, longitude: home.longitude }}
            title={home.students.map((s) => s.name).join(', ')}
            description={[home.parentName, home.mobileNumber, home.address].filter(Boolean).join(' · ')}
            pinColor={colors.danger}
          />
        ))}
      </MapView>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerCard}>
          <View style={styles.headerText}>
            <Text style={styles.title}>Route Map</Text>
            <Text style={styles.subtitle}>
              {loading ? 'Loading homes…' : `${homes.length} home${homes.length === 1 ? '' : 's'} · ${studentCount} student${studentCount === 1 ? '' : 's'}`}
            </Text>
          </View>
          <AnimatedPressable style={styles.iconButton} onPress={() => fitToMarkers(homes)}>
            <Ionicons name="scan" size={20} color={colors.textPrimary} />
          </AnimatedPressable>
          <AnimatedPressable style={styles.iconButton} onPress={loadHomes} disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color={colors.textSecondary} />
            ) : (
              <Ionicons name="refresh" size={20} color={colors.textPrimary} />
            )}
          </AnimatedPressable>
        </View>
      </View>

      {/* Sharing panel */}
      <View style={styles.panel}>
        <View style={styles.panelRow}>
          <View style={[styles.statusDot, { backgroundColor: sharing.isSharing ? colors.success : colors.textTertiary }]} />
          <View style={styles.flex}>
            <Text style={styles.panelTitle}>
              {sharing.isSharing ? 'Sharing bus location' : 'Location sharing is off'}
            </Text>
            <Text style={styles.panelSubtitle} numberOfLines={2}>
              {sharing.error
                ? sharing.error
                : sharing.isSharing
                  ? sharing.lastSentAt
                    ? `Parents can see the bus · updated ${formatAgo(sharing.lastSentAt)}`
                    : 'Waiting for GPS…'
                  : 'Start sharing when the trip begins so parents can track the bus.'}
            </Text>
          </View>
        </View>

        {sharing.isSharing ? (
          <SecondaryButton title="Stop sharing" icon="stop-circle" onPress={handleToggleSharing} loading={toggling} />
        ) : (
          <PrimaryButton title="Start sharing live location" icon="navigate" onPress={handleToggleSharing} loading={toggling} />
        )}

        {missing.length > 0 && (
          <AnimatedPressable style={styles.missingRow} onPress={showMissing}>
            <Ionicons name="alert-circle" size={16} color={colors.warning} />
            <Text style={styles.missingText}>
              {missing.length} student{missing.length === 1 ? '' : 's'} without a home location
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
          </AnimatedPressable>
        )}
      </View>

      <BottomNavigation activeTab={activeTab} onTabPress={handleTabPress} />
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
  header: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 40,
    left: spacing(4),
    right: spacing(4),
  },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: spacing(3),
    paddingLeft: spacing(4),
    paddingRight: spacing(2),
    ...shadow.soft,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
    marginTop: 2,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  panel: {
    position: 'absolute',
    left: spacing(4),
    right: spacing(4),
    bottom: 95,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing(4),
    gap: spacing(3),
    ...shadow.soft,
  },
  panelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing(3),
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  panelSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
    marginTop: 2,
  },
  missingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(2),
  },
  missingText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});

export default OwnerMapScreen;
