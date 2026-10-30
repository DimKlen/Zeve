import { Link, type Href } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { t } from '@/i18n';
import { colors, space, type } from '@/theme';

// Écrans vides de la Phase 0, accessibles en développement pour vérifier la navigation.
const DEV_ROUTES: Href[] = [
  '/login',
  '/connecting',
  '/auth/callback',
  '/reminders',
  '/garden',
  '/settings',
  '/plant/demo',
  '/plant/demo/chat',
  '/new-plant',
  '/new-plant/species',
  '/new-plant/added',
  '/settings/rooms',
  '/settings/privacy',
  '/dev/plants',
  '/dev/kitchen',
];

// Lancement : séquence animée et aiguillage session / onboarding en Phase 2 (docs/04 §1).
// En attendant : le mot-symbole (Bricolage) et le slogan (Figtree) valident le chargement des polices.
export default function LaunchScreen() {
  return (
    <Screen name="launch" tone="dark">
      <View style={styles.brand}>
        <Text style={styles.word}>{t('app.name')}</Text>
        <Text style={styles.tagline}>{t('app.tagline')}</Text>
      </View>
      {__DEV__ && (
        <ScrollView contentContainerStyle={styles.routes}>
          {DEV_ROUTES.map((href) => (
            <Link key={String(href)} href={href} style={styles.route}>
              {String(href)}
            </Link>
          ))}
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  brand: { alignItems: 'center', gap: space.s, paddingTop: space.x5 * 3 },
  word: { ...type.splash, color: colors.darkText },
  tagline: { ...type.body, color: colors.darkMuted },
  routes: { padding: space.xxl, gap: space.m },
  route: { ...type.small, color: colors.darkMuted, minHeight: 24 },
});
