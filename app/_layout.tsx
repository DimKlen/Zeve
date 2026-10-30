import {
  BricolageGrotesque_500Medium,
  BricolageGrotesque_700Bold,
} from '@expo-google-fonts/bricolage-grotesque';
import {
  Figtree_400Regular,
  Figtree_500Medium,
  Figtree_600SemiBold,
  Figtree_700Bold,
  useFonts,
} from '@expo-google-fonts/figtree';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ToastHost } from '@/components/Toast';
import { persistMaxAge, queryClient, queryPersister } from '@/lib/queryClient';
import { colors } from '@/theme';

// Le splash natif (#1F3D2B) reste affiché jusqu'au chargement des polices.
void SplashScreen.preventAutoHideAsync();

const persistOptions = { persister: queryPersister, maxAge: persistMaxAge, buster: 'v1' };

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    BricolageGrotesque_500Medium,
    BricolageGrotesque_700Bold,
    Figtree_400Regular,
    Figtree_500Medium,
    Figtree_600SemiBold,
    Figtree_700Bold,
  });
  const ready = fontsLoaded || fontError !== null;

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
      <GestureHandlerRootView style={styles.root}>
        <SafeAreaProvider>
          <StatusBar style="dark" />
          {/* Transitions maison (docs/03) : la pile native n'anime rien. */}
          <Stack
            screenOptions={{
              headerShown: false,
              animation: 'none',
              contentStyle: styles.content,
            }}
          >
            {/* index en premier : sur natif, le premier écran déclaré sert d'écran initial. */}
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="auth/callback" />
            <Stack.Screen name="(onboarding)/reminders" />
            <Stack.Screen name="(app)" />
            <Stack.Screen name="dev/plants" />
            <Stack.Screen name="dev/kitchen" />
          </Stack>
          <ToastHost />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </PersistQueryClientProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { backgroundColor: colors.bg },
});
