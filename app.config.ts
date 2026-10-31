import type { ExpoConfig } from 'expo/config';

import fr from './src/i18n/fr.json';

// Valeurs du thème (src/theme) : la config native ne peut pas importer src/theme, d'où la répétition.
const FOREST = '#1F3D2B'; // splash natif (docs/08)
const BG = '#F3EEE3';
const SUN = '#E8B931';

// [À FOURNIR] bundle id / package définitifs (docs/09 « À fournir par toi »).
const BUNDLE_ID = process.env.ZEVE_BUNDLE_ID ?? 'com.zeve.app';

// Build de tests de bout en bout (profil EAS « e2e ») : l'émulateur parle au Supabase local en HTTP,
// interdit par défaut sur Android. Jamais activé dans les builds preview / production.
const E2E = process.env.ZEVE_E2E === '1';
const e2ePlugins: NonNullable<ExpoConfig['plugins']> = E2E
  ? [['expo-build-properties', { android: { usesCleartextTraffic: true } }]]
  : [];

const config: ExpoConfig = {
  name: 'Zeve',
  slug: 'zeve',
  owner: 'dimklen',
  scheme: 'zeve',
  version: '1.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'light',
  icon: './assets/icon.png',
  backgroundColor: BG,
  ios: {
    bundleIdentifier: BUNDLE_ID,
    supportsTablet: false,
    usesAppleSignIn: true,
    infoPlist: {
      CFBundleDisplayName: 'Zeve',
    },
  },
  android: {
    package: BUNDLE_ID,
    adaptiveIcon: {
      backgroundColor: BG,
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
    // La session Supabase est dans le stockage de l'app : pas de copie dans les sauvegardes Android.
    allowBackup: false,
  },
  web: {
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-font',
    'expo-image',
    'expo-secure-store',
    'expo-web-browser',
    'expo-apple-authentication',
    ['expo-status-bar', { style: 'dark' }],
    // Petite icône Android de la barre d'état : silhouette blanche, teintée en jaune.
    ['expo-notifications', { icon: './assets/notification-icon.png', color: SUN }],
    [
      'expo-image-picker',
      {
        cameraPermission: fr.permissions.camera,
        photosPermission: fr.permissions.photos,
        microphonePermission: false,
      },
    ],
    // Splash natif uni : la séquence de lancement animée est rendue par app/index.tsx (docs/03 §6).
    ['expo-splash-screen', { backgroundColor: FOREST }],
    ...e2ePlugins,
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    eas: { projectId: 'bb30f9e9-f903-40cb-b6c1-ed187fb5caf2' },
  },
};

export default config;
