import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { IconCamera, IconLeafSearch } from '@/components/icons';
import { PressableScale } from '@/components/PressableScale';
import { Rise } from '@/components/Rise';
import { Screen } from '@/components/Screen';
import { Spinner } from '@/components/Spinner';
import { TextButton } from '@/components/TextButton';
import { showToast } from '@/components/Toast';
import { useAuthStore } from '@/features/auth/authStore';
import { DiscoverError, discoverFromPhoto } from '@/features/discover/api';
import { DiscoveryPhoto } from '@/features/discover/DiscoveryPhoto';
import { useDiscoveries, type Discovery } from '@/features/discover/history';
import { t } from '@/i18n';
import { go } from '@/motion/transitions';
import { a11y, layout, makeStyles, radius, space, type, useColors } from '@/theme';

const THUMB = 52;
const dateFormat = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' });

/**
 * Découvrir (docs/06 F16, non maquetté) : photographier n'importe quelle plante pour la reconnaître
 * et en apprendre plus. Rien n'est ajouté au jardin (l'ajout passe par le + du jardin).
 */
export default function DiscoverScreen() {
  const colors = useColors();
  const styles = useStyles();
  const userId = useAuthStore((s) => s.session?.user.id);
  const items = useDiscoveries((s) => s.items);
  const add = useDiscoveries((s) => s.add);
  const [busy, setBusy] = useState(false);

  const discover = async (source: 'camera' | 'library') => {
    if (!userId || busy) return;
    try {
      const found = await discoverFromPhoto(userId, source, () => setBusy(true));
      if (!found) return;
      if (!found.candidates.length) {
        showToast(t('discover.notFound'));
        return;
      }
      add(found);
      go('discoverResult', { id: found.id });
    } catch (e) {
      showToast(
        e instanceof DiscoverError && e.reason === 'quota'
          ? t('discover.quota')
          : t('discover.failed'),
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen name="discover" refocusEnter="fade" edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.titles}>
          <Text
            style={styles.title}
            accessibilityRole="header"
            maxFontSizeMultiplier={a11y.maxTitleScale}
          >
            {t('discover.title')}
          </Text>
          <Text style={styles.intro}>{t('discover.intro')}</Text>
        </View>

        <Rise delay="d1" style={styles.actions}>
          {busy ? (
            <View
              style={styles.busy}
              accessibilityRole="progressbar"
              accessibilityLiveRegion="polite"
            >
              <Spinner />
              <Text style={styles.busyText}>{t('discover.recognizing')}</Text>
            </View>
          ) : (
            <>
              <Button
                label={t('discover.take')}
                icon={(c) => <IconCamera size={20} color={c} />}
                onPress={() => void discover('camera')}
              />
              <TextButton label={t('discover.pick')} onPress={() => void discover('library')} />
            </>
          )}
        </Rise>

        <Rise delay="d2" style={styles.history}>
          <Text style={styles.section} accessibilityRole="header">
            {t('discover.history')}
          </Text>
          {items.length ? (
            items.map((item) => <HistoryRow key={item.id} item={item} />)
          ) : (
            <View style={styles.empty}>
              <IconLeafSearch size={28} color={colors.inkMuted} />
              <Text style={styles.emptyText}>{t('discover.empty')}</Text>
            </View>
          )}
        </Rise>
      </ScrollView>
    </Screen>
  );
}

function HistoryRow({ item }: { item: Discovery }) {
  const styles = useStyles();
  const c = item.candidates[item.selected] ?? item.candidates[0];
  if (!c) return null;
  const name = c.commonName ?? c.latin;
  const date = dateFormat.format(new Date(item.at));
  return (
    <PressableScale
      onPress={() => go('discoverResult', { id: item.id })}
      accessibilityRole="button"
      accessibilityLabel={t('discover.rowA11y', { name, latin: c.latin, date })}
      style={styles.row}
    >
      <DiscoveryPhoto uri={item.photoUri} iconSize={20} style={styles.thumb} />
      <View style={styles.rowTexts}>
        <Text style={styles.rowName} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.rowLatin} numberOfLines={1}>
          {c.latin}
        </Text>
      </View>
      <Text style={styles.rowDate}>{date}</Text>
    </PressableScale>
  );
}

const useStyles = makeStyles((colors) => ({
  content: {
    paddingTop: space.xs,
    paddingHorizontal: layout.screenPadTabs,
    paddingBottom: layout.bottomNavClearance,
    gap: space.x4,
  },
  titles: { gap: space.s },
  title: { ...type.title, color: colors.forest },
  intro: { ...type.body, color: colors.inkMuted },
  actions: { gap: space.xs },
  busy: {
    height: 104,
    borderRadius: radius.card,
    backgroundColor: colors.sageDeep,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
  },
  busyText: { ...type.bodyS, fontFamily: type.cardTitle.fontFamily, color: colors.forest },
  history: { gap: space.m },
  section: { ...type.sectionTitle, color: colors.forest },
  empty: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    paddingVertical: space.x4,
    alignItems: 'center',
    gap: space.s,
  },
  emptyText: { ...type.small, color: colors.inkMuted },
  row: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.m,
  },
  thumb: { width: THUMB, height: THUMB, borderRadius: radius.sm },
  rowTexts: { flex: 1 },
  rowName: { ...type.cardTitle, color: colors.ink },
  rowLatin: { ...type.caption, fontStyle: 'italic', color: colors.inkMuted },
  rowDate: { ...type.caption, color: colors.inkMuted },
}));
