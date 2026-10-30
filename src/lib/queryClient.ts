import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import NetInfo from '@react-native-community/netinfo';
import { focusManager, onlineManager, QueryClient } from '@tanstack/react-query';
import { AppState, Platform } from 'react-native';

const DAY_MS = 24 * 60 * 60 * 1000;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { gcTime: DAY_MS, staleTime: 30 * 1000, retry: 2 },
  },
});

// Retour au premier plan = « focus » : les données périmées sont rechargées (docs/06 F3).
if (Platform.OS !== 'web') {
  focusManager.setEventListener((setFocused) => {
    const sub = AppState.addEventListener('change', (state) => setFocused(state === 'active'));
    return () => sub.remove();
  });
}

// Réseau : sans connexion, requêtes et mutations attendent (et l'arrosage est mis en file, F12).
// Sur le web, TanStack Query suit déjà navigator.onLine.
if (Platform.OS !== 'web') {
  onlineManager.setEventListener((setOnline) =>
    NetInfo.addEventListener((state) => setOnline(state.isConnected !== false)),
  );
}

// Cache persisté : le jardin s'affiche hors ligne (docs/11, Phase 7).
export const queryPersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'zeve-query-cache',
});

export const persistMaxAge = DAY_MS;
