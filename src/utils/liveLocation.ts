import * as Location from 'expo-location';
import { locationAPI, LatLng } from '../services/api';

// Owner-side live bus location sharing. Lives outside any screen so sharing
// keeps running while the owner moves between tabs; it stops when they tap
// "Stop", log out, or the app is killed (foreground-only — see README).

// Don't hit the server more often than this, however often the GPS fires
const MIN_SEND_INTERVAL_MS = 5000;
// GPS may go quiet while the bus is parked; keep re-sending the last fix so
// parents don't see it as offline (the server marks it stale after 2 min)
const HEARTBEAT_MS = 30000;

type Listener = (state: SharingState) => void;

export interface SharingState {
  isSharing: boolean;
  lastPosition: LatLng | null;
  lastSentAt: number | null;
  error: string | null;
}

let state: SharingState = { isSharing: false, lastPosition: null, lastSentAt: null, error: null };
let subscription: Location.LocationSubscription | null = null;
let heartbeat: ReturnType<typeof setInterval> | null = null;
let lastCoords: Location.LocationObjectCoords | null = null;
const listeners = new Set<Listener>();

const setState = (patch: Partial<SharingState>) => {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener(state));
};

export const getSharingState = () => state;

export const subscribeToSharing = (listener: Listener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const send = async (coords: Location.LocationObjectCoords) => {
  lastCoords = coords;
  const position = { latitude: coords.latitude, longitude: coords.longitude };
  setState({ lastPosition: position });

  if (state.lastSentAt && Date.now() - state.lastSentAt < MIN_SEND_INTERVAL_MS) return;
  // Claim the slot before awaiting so overlapping GPS callbacks don't double-send
  setState({ lastSentAt: Date.now() });
  try {
    await locationAPI.updateBusLocation({
      ...position,
      heading: coords.heading != null && coords.heading >= 0 ? coords.heading : null,
      speed: coords.speed != null && coords.speed >= 0 ? coords.speed : null,
    });
    if (state.error) setState({ error: null });
  } catch (error) {
    setState({ error: error instanceof Error ? error.message : 'Failed to send location' });
  }
};

export const requestForegroundPermission = async (): Promise<boolean> => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
};

export const startSharing = async (): Promise<void> => {
  if (state.isSharing) return;
  setState({ isSharing: true, error: null, lastSentAt: null });

  if (!(await requestForegroundPermission())) {
    setState({ isSharing: false });
    throw new Error('Location permission is needed to share the bus location with parents.');
  }

  const watcher = await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.High,
      timeInterval: MIN_SEND_INTERVAL_MS,
      distanceInterval: 10,
    },
    (location) => {
      send(location.coords);
    }
  );
  // Stopped while we were waiting on the permission prompt / GPS
  if (!state.isSharing) {
    watcher.remove();
    return;
  }
  subscription = watcher;
  heartbeat = setInterval(() => {
    if (lastCoords) send(lastCoords);
  }, HEARTBEAT_MS);
};

export const stopSharing = async (): Promise<void> => {
  const wasSharing = state.isSharing;
  subscription?.remove();
  subscription = null;
  if (heartbeat) clearInterval(heartbeat);
  heartbeat = null;
  lastCoords = null;
  setState({ isSharing: false, lastSentAt: null });
  if (wasSharing) {
    try {
      await locationAPI.stopSharing();
    } catch (error) {
      // The server also treats a location as offline once it goes stale
      console.error('Failed to notify server that sharing stopped:', error);
    }
  }
};
