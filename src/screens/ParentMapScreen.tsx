import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Alert, BackHandler, Platform, Linking } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { parentAPI, BusInfo, HomeLocation } from '../services/api';
import { AnimatedPressable } from '../components/ui/Animated';
import { PrimaryButton, SecondaryButton } from '../components/ui/Buttons';
import { ThemeColors, radius, spacing, shadow } from '../utils/theme';
import { useAppTheme, useThemedStyles } from '../context/ThemeContext';
import { DEFAULT_REGION, distanceKm, formatAgo, formatDistance, regionAround } from '../utils/geo';

// How often to ask the server where the bus is
const POLL_INTERVAL_MS = 5000;

export type ParentMapMode = 'track' | 'setHome';

interface ParentMapScreenProps {
  initialMode: ParentMapMode;
  homeLocation: HomeLocation | null;
  onBack: () => void;
  onHomeSaved: (home: HomeLocation) => void;
}

const describeAddress = async (latitude: number, longitude: number): Promise<string | undefined> => {
  try {
    const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
    if (!place) return undefined;
    const parts = [place.name, place.street, place.district, place.city].filter(
      (part, i, all) => part && all.indexOf(part) === i
    );
    return parts.join(', ').slice(0, 200) || undefined;
  } catch {
    // Reverse geocoding is best-effort; the pin itself is what matters
    return undefined;
  }
};

const ParentMapScreen: React.FC<ParentMapScreenProps> = ({ initialMode, homeLocation, onBack, onHomeSaved }) => {
  const { colors, isDark } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const mapRef = useRef<MapView>(null);

  const [mode, setMode] = useState<ParentMapMode>(initialMode);
  const [buses, setBuses] = useState<BusInfo[]>([]);
  const [home, setHome] = useState<HomeLocation | null>(homeLocation);
  const [saving, setSaving] = useState(false);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const initialRegion = home ? regionAround(home) : DEFAULT_REGION;
  // Centre of the map while picking a home — the fixed pin sits here. Starts
  // unset without a saved home so we never save the country-wide default view.
  const centerRef = useRef<Region | null>(home ? initialRegion : null);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (mode === 'setHome' && home) {
        setMode('track');
      } else {
        onBack();
      }
      return true;
    });
    return () => backHandler.remove();
  }, [mode, home]);

  useEffect(() => {
    Location.requestForegroundPermissionsAsync().then(({ status }) => {
      const granted = status === 'granted';
      setHasLocationPermission(granted);
      // No saved home yet: start the picker at the parent's current position
      if (granted && !homeLocation) goToMyLocation();
    });
  }, []);

  const loadBuses = useCallback(async () => {
    try {
      setBuses(await parentAPI.getBusLocations());
    } catch (error) {
      console.error('Failed to load bus location:', error);
    }
  }, []);

  useEffect(() => {
    loadBuses();
    const id = setInterval(loadBuses, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [loadBuses]);

  const liveBus = buses.find((b) => b.location?.isLive);
  const lastKnownBus = liveBus ?? buses.find((b) => b.location);
  const primaryBus = lastKnownBus ?? buses[0];

  // Fit bus + home into view the first time we get a live position
  const hasFitted = useRef(false);
  useEffect(() => {
    if (mode !== 'track' || hasFitted.current || !liveBus?.location) return;
    hasFitted.current = true;
    const points = [liveBus.location, ...(home ? [home] : [])];
    mapRef.current?.fitToCoordinates(points, {
      edgePadding: { top: 160, right: 80, bottom: 300, left: 80 },
      animated: true,
    });
  }, [liveBus, home, mode]);

  const goToMyLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location', 'Allow location access to use your current position.');
        return;
      }
      setHasLocationPermission(true);
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      mapRef.current?.animateToRegion(regionAround(position.coords, 0.005), 600);
    } catch (error) {
      Alert.alert('Location', 'Could not get your current location. Please try again.');
    }
  };

  const centerOnBus = () => {
    if (primaryBus?.location) {
      mapRef.current?.animateToRegion(regionAround(primaryBus.location, 0.01), 600);
    }
  };

  const saveHome = async () => {
    const center = centerRef.current;
    // A zoomed-out view means the pin can't really be on the house yet
    if (!center || center.latitudeDelta > 0.05) {
      Alert.alert('Home location', 'Zoom in and move the map so the pin is exactly on your home, then save.');
      return;
    }
    setSaving(true);
    try {
      const address = await describeAddress(center.latitude, center.longitude);
      const saved = await parentAPI.setHomeLocation({
        latitude: center.latitude,
        longitude: center.longitude,
        address,
      });
      setHome(saved);
      onHomeSaved(saved);
      setMode('track');
      Alert.alert('Saved', 'Your home location has been shared with the bus driver.');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to save home location');
    } finally {
      setSaving(false);
    }
  };

  const callDriver = () => {
    if (primaryBus) Linking.openURL(`tel:${primaryBus.owner.mobileNumber}`);
  };

  const busDistance = liveBus?.location && home ? distanceKm(liveBus.location, home) : null;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={initialRegion}
        showsUserLocation={hasLocationPermission}
        showsMyLocationButton={false}
        userInterfaceStyle={isDark ? 'dark' : 'light'}
        onRegionChangeComplete={(region) => {
          centerRef.current = region;
        }}
      >
        {mode === 'track' && home && (
          <Marker coordinate={home} title="Home" description={home.address}>
            <View style={[styles.markerBubble, { backgroundColor: colors.primary }]}>
              <Ionicons name="home" size={16} color={colors.onPrimary} />
            </View>
          </Marker>
        )}
        {buses.map((bus) =>
          bus.location ? (
            <Marker
              key={bus.owner.id}
              coordinate={bus.location}
              title={`${bus.owner.name}'s bus`}
              description={bus.location.isLive ? `Live · ${formatAgo(bus.location.updatedAt)}` : `Last seen ${formatAgo(bus.location.updatedAt)}`}
            >
              <View style={[styles.markerBubble, { backgroundColor: bus.location.isLive ? colors.warning : colors.textTertiary }]}>
                <Ionicons name="bus" size={18} color="#FFFFFF" />
              </View>
            </Marker>
          ) : null
        )}
      </MapView>

      {/* Fixed centre pin while picking home */}
      {mode === 'setHome' && (
        <View pointerEvents="none" style={styles.centerPinWrap}>
          <Ionicons name="location" size={44} color={colors.danger} />
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerCard}>
          <AnimatedPressable
            style={styles.iconButton}
            onPress={() => (mode === 'setHome' && home ? setMode('track') : onBack())}
          >
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </AnimatedPressable>
          <View style={styles.headerText}>
            <Text style={styles.title}>{mode === 'setHome' ? 'Set home location' : 'Track bus'}</Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              {mode === 'setHome'
                ? 'Move the map to place the pin on your home'
                : primaryBus
                  ? primaryBus.owner.name
                  : 'No bus linked yet'}
            </Text>
          </View>
          <AnimatedPressable style={styles.iconButton} onPress={goToMyLocation}>
            <Ionicons name="locate" size={20} color={colors.textPrimary} />
          </AnimatedPressable>
        </View>
      </View>

      {/* Bottom panel */}
      <View style={styles.panel}>
        {mode === 'setHome' ? (
          <>
            <Text style={styles.panelSubtitle}>
              The driver will see this pin as your child's pickup and drop point.
            </Text>
            <PrimaryButton title="Save home location" icon="checkmark" onPress={saveHome} loading={saving} />
            <SecondaryButton title="Use my current location" icon="locate" onPress={goToMyLocation} />
          </>
        ) : (
          <>
            <View style={styles.panelRow}>
              <View style={[styles.statusDot, { backgroundColor: liveBus ? colors.success : colors.textTertiary }]} />
              <View style={styles.flex}>
                <Text style={styles.panelTitle}>
                  {liveBus ? 'Bus is on the way' : 'Bus is not sharing location'}
                </Text>
                <Text style={styles.panelSubtitle}>
                  {liveBus?.location
                    ? `Updated ${formatAgo(liveBus.location.updatedAt)}${busDistance != null ? ` · ${formatDistance(busDistance)} from home` : ''}`
                    : lastKnownBus?.location
                      ? `Last seen ${formatAgo(lastKnownBus.location.updatedAt)}`
                      : 'You\'ll see the bus here once the driver starts the trip.'}
                </Text>
              </View>
            </View>
            <View style={styles.buttonRow}>
              {primaryBus?.location && (
                <SecondaryButton title="Bus" icon="bus" onPress={centerOnBus} style={styles.flex} compact />
              )}
              {primaryBus && (
                <SecondaryButton title="Call" icon="call" onPress={callDriver} style={styles.flex} compact />
              )}
              <SecondaryButton
                title={home ? 'Change home' : 'Set home'}
                icon="home"
                onPress={() => setMode('setHome')}
                style={styles.flex}
                compact
              />
            </View>
          </>
        )}
      </View>
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
    paddingVertical: spacing(2),
    paddingHorizontal: spacing(2),
    ...shadow.soft,
  },
  headerText: {
    flex: 1,
    paddingHorizontal: spacing(1),
  },
  title: {
    fontSize: 18,
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
  centerPinWrap: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    // Lift the pin so its tip, not its centre, marks the spot
    paddingBottom: 44,
  },
  markerBubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  panel: {
    position: 'absolute',
    left: spacing(4),
    right: spacing(4),
    bottom: spacing(8),
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
  buttonRow: {
    flexDirection: 'row',
    gap: spacing(2),
  },
});

export default ParentMapScreen;
