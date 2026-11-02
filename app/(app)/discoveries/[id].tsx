import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { Chip } from '@/components/Chip';
import { IconBack } from '@/components/icons';
import { IconButton } from '@/components/IconButton';
import { Rise } from '@/components/Rise';
import { Screen } from '@/components/Screen';
import { Spinner } from '@/components/Spinner';
import { TextButton } from '@/components/TextButton';
import { factsFor } from '@/features/discover/api';
import { DiscoveryPhoto } from '@/features/discover/DiscoveryPhoto';
import { useDiscoveries } from '@/features/discover/history';
import type { Edibility, PlantFacts } from '@/features/discover/model';
import { CareGuideSheet } from '@/features/plant/CareGuide';
import { t } from '@/i18n';
import { goBack } from '@/motion/transitions';
import { a11y, layout, makeStyles, radius, space, type, useColors, type Palette } from '@/theme';

/** En dessous : bandeau « Pas sûr » et autres possibilités. */
const UNSURE_BELOW = 0.5;
const PHOTO_HEIGHT = 260;

const edibilityColor = (status: Edibility, colors: Palette) =>
  status === 'toxic'
    ? colors.danger
    : status === 'edible' || status === 'partly'
      ? colors.okDot
      : colors.inkMuted;

/** Fiche « découverte » (docs/06 F16, non maquettée, style de la fiche plante). */
export default function DiscoveryScreen() {
  const styles = useStyles();
  const { id } = useLocalSearchParams<{ id: string }>();
  const item = useDiscoveries((s) => s.items.find((x) => x.id === id));
  const update = useDiscoveries((s) => s.update);
  const [loading, setLoading] = useState(false);
  const [guide, setGuide] = useState(false);

  if (!item) {
    return (
      <Screen name="discoverResult">
        <View style={styles.header}>
          <IconButton
            accessibilityLabel={t('discover.backA11y')}
            onPress={goBack}
            icon={(c) => <IconBack color={c} />}
          />
        </View>
      </Screen>
    );
  }

  const candidate = item.candidates[item.selected] ?? item.candidates[0]!;
  const name = candidate.commonName ?? candidate.latin;
  const facts = item.facts[candidate.latin];
  const unsure = candidate.score < UNSURE_BELOW && item.selected === 0;

  const choose = async (index: number) => {
    update(item.id, { selected: index });
    const other = item.candidates[index]!;
    if (other.latin in item.facts) return;
    setLoading(true);
    const loaded = await factsFor(other).catch(() => null);
    setLoading(false);
    // Relu au retour du réseau : une autre fiche a pu arriver entre-temps.
    const current = useDiscoveries.getState().items.find((x) => x.id === item.id);
    update(item.id, { facts: { ...current?.facts, [other.latin]: loaded } });
  };

  return (
    <Screen name="discoverResult" enter="up" edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <IconButton
            accessibilityLabel={t('discover.backA11y')}
            onPress={goBack}
            icon={(c) => <IconBack color={c} />}
          />
        </View>

        <View style={styles.content}>
          <DiscoveryPhoto
            uri={item.photoUri}
            iconSize={36}
            style={styles.photo}
            accessibilityLabel={t('discover.photoA11y', { name })}
          />

          <View style={styles.titles}>
            <Text
              style={styles.name}
              accessibilityRole="header"
              maxFontSizeMultiplier={a11y.maxTitleScale}
            >
              {name}
            </Text>
            <Text style={styles.latin}>{candidate.latin}</Text>
            <View style={styles.meta}>
              {candidate.family && (
                <Text style={styles.family}>
                  {t('discover.family', { family: candidate.family })}
                </Text>
              )}
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {t('discover.confidence', { n: Math.round(candidate.score * 100) })}
                </Text>
              </View>
            </View>
          </View>

          {(unsure || item.selected > 0) && item.candidates.length > 1 && (
            <View style={styles.unsure}>
              {unsure && <Text style={styles.unsureText}>{t('discover.unsure')}</Text>}
              <View style={styles.chips}>
                {item.candidates.map((c, i) => (
                  <Chip
                    key={c.latin}
                    label={c.commonName ?? c.latin}
                    variant="room"
                    selected={i === item.selected}
                    onPress={() => void choose(i)}
                  />
                ))}
              </View>
            </View>
          )}

          {loading ? (
            <View style={styles.loading} accessibilityLiveRegion="polite">
              <Spinner size={24} />
              <Text style={styles.muted}>{t('discover.factsLoading')}</Text>
            </View>
          ) : facts ? (
            <FactCards facts={facts} />
          ) : (
            <Text style={styles.muted}>{t('discover.factsFailed')}</Text>
          )}

          {candidate.catalogSpeciesId && (
            <View style={styles.guide}>
              <TextButton label={t('care.guideOpen')} onPress={() => setGuide(true)} />
            </View>
          )}
        </View>
      </ScrollView>

      {candidate.catalogSpeciesId && (
        <CareGuideSheet
          speciesId={candidate.catalogSpeciesId}
          name={name}
          visible={guide}
          onClose={() => setGuide(false)}
        />
      )}
    </Screen>
  );
}

/** Cartes courtes, une idée par carte (style « Bon à savoir ») ; les vides ne s'affichent pas. */
function FactCards({ facts }: { facts: PlantFacts }) {
  const colors = useColors();
  const styles = useStyles();
  const { status, note } = facts.edibility;
  const tone = edibilityColor(status, colors);
  const lists: { key: string; title: string; items: string[] }[] = [
    { key: 'uses', title: t('discover.usesTitle'), items: facts.humanUses },
    { key: 'wildlife', title: t('discover.wildlifeTitle'), items: facts.wildlife },
    { key: 'fun', title: t('discover.funTitle'), items: facts.funFacts },
  ];
  return (
    <>
      <Rise delay="d1" style={styles.card}>
        <View style={styles.cardHead}>
          <Text style={styles.overline}>{t('discover.edibleTitle')}</Text>
          <View style={[styles.edibility, { borderColor: tone }]}>
            <View style={[styles.dot, { backgroundColor: tone }]} />
            <Text
              style={[
                styles.edibilityText,
                { color: status === 'toxic' ? colors.danger : colors.ink },
              ]}
            >
              {t(`discover.edibility.${status}`)}
            </Text>
          </View>
        </View>
        {note && <Text style={styles.text}>{note}</Text>}
        <Text style={styles.safety}>{t('discover.safety')}</Text>
      </Rise>

      {facts.origin && (
        <Rise delay="d2" style={styles.card}>
          <Text style={styles.overline}>{t('discover.originTitle')}</Text>
          <Text style={styles.text}>{facts.origin}</Text>
        </Rise>
      )}

      {lists
        .filter((l) => l.items.length)
        .map((l) => (
          <Rise key={l.key} delay="d3" style={styles.card}>
            <Text style={styles.overline}>{l.title}</Text>
            {l.items.map((line) => (
              <View key={line} style={styles.bullet}>
                <View style={[styles.dot, styles.bulletDot]} />
                <Text style={[styles.text, styles.bulletText]}>{line}</Text>
              </View>
            ))}
          </Rise>
        ))}
    </>
  );
}

const useStyles = makeStyles((colors) => ({
  scroll: { paddingBottom: space.x5 * 2 },
  header: {
    paddingTop: space.xs,
    paddingHorizontal: layout.screenPadDetail,
    flexDirection: 'row',
  },
  content: { paddingTop: space.m, paddingHorizontal: layout.screenPadDetail, gap: space.ml },
  photo: { height: PHOTO_HEIGHT, borderRadius: radius.card },
  titles: { gap: 2 },
  name: { ...type.title, color: colors.forest },
  latin: { ...type.bodyS, fontStyle: 'italic', color: colors.inkMuted, paddingRight: 2 },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: space.s,
    marginTop: space.xs,
  },
  family: { ...type.caption, color: colors.inkMuted },
  badge: {
    height: 26,
    paddingHorizontal: space.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.sage,
    justifyContent: 'center',
  },
  badgeText: { ...type.micro, fontFamily: type.label.fontFamily, color: colors.forestText },
  unsure: { gap: space.s },
  unsureText: { ...type.small, color: colors.warnText },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.s },
  loading: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: space.m },
  muted: { ...type.small, color: colors.inkMuted },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: space.ml,
    paddingHorizontal: space.ml + 2,
    gap: space.s,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  overline: { ...type.overline, color: colors.inkMuted },
  edibility: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    height: 28,
    paddingHorizontal: space.sm,
    borderRadius: radius.pill,
    borderWidth: 1.5,
  },
  edibilityText: { ...type.label },
  dot: { width: 8, height: 8, borderRadius: 4 },
  text: { ...type.small, color: colors.ink },
  safety: { ...type.caption, color: colors.inkMuted },
  bullet: { flexDirection: 'row', gap: space.sm, alignItems: 'flex-start' },
  bulletDot: { backgroundColor: colors.sageDeep, marginTop: 6 },
  bulletText: { flex: 1 },
  guide: { alignSelf: 'flex-start' },
}));
