import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient } from '@tanstack/react-query';

const DAY_MS = 24 * 60 * 60 * 1000;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { gcTime: DAY_MS, staleTime: 30 * 1000, retry: 2 },
  },
});

// Cache persisté : le jardin s'affiche hors ligne (docs/11, Phase 7).
export const queryPersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'zeve-query-cache',
});

export const persistMaxAge = DAY_MS;
