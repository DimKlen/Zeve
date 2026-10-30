import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { IconAir, IconBack, IconCamera, IconDrop, IconMore, IconSun } from '@/components/icons';
import { GrowthSteps } from '@/components/GrowthSteps';
import { IconButton } from '@/components/IconButton';
import { InfoTile } from '@/components/InfoTile';
import { PressableScale } from '@/components/PressableScale';
import { Rise } from '@/components/Rise';
import { Screen } from '@/components/Screen';
import { WaterGauge } from '@/components/WaterGauge';
import { usePlant, useWatering } from '@/features/garden/api';
import { statusOf } from '@/features/garden/gardenRules';
import { MascotScene } from '@/features/plant/MascotScene';
import { PlantOptionsSheet } from '@/features/plant/PlantOptionsSheet';
import { t } from '@/i18n';
import { go, goBack } from '@/motion/transitions';
import { moodBubble, sinceText } from '@/plants/plantStatus';
import { a11y, colors, control, layout, radius, space, type } from '@/theme';

/** Fiche plante (docs/04 §8). */
export default function PlantScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: plant, isSuccess } = usePlant(id);
  const { water, undo } = useWatering();
  const [drops, setDrops] = useState(0);
  const [justWatered, setJustWatered] = useState(false);
  const [menu, setMenu] = useState(false);

  if (!plant) {
    return (
      <Screen name="plant">
        <View style={styles.header}>
          <IconButton
            accessibilityLabel={t('plant.backA11y')}
            onPress={goBack}
            icon={(c) => <IconBack color={c} />}
          />
        </View>
        {/* Seulement si la liste est chargée : hors ligne sans cache, on n'affirme rien. */}
        {isSuccess && <Text style={styles.notFound}>{t('plant.notFound')}</Text>}
      </Screen>
    );
  }

  const s = statusOf(plant);
  const latinRoom = plant.roomName ? `${plant.latin} · ${plant.roomName}` : plant.latin;

  const toggleWater = () => {
    if (s.wateredToday) {
      setJustWatered(false);
      undo(plant);
      return;
    }
    setJustWatered(true);
    setDrops((n) => n + 1);
    water(plant);
  };

  return (
    <Screen name="plant" enter="zoom" edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <IconButton
            accessibilityLabel={t('plant.backA11y')}
            onPress={goBack}
            icon={(c) => <IconBack color={c} />}
          />
          <View style={styles.titles}>
            <Text
              style={styles.name}
              accessibilityRole="header"
              maxFontSizeMultiplier={a11y.maxTitleScale}
              numberOfLines={1}
            >
              {plant.nickname}
            </Text>
            <Text style={styles.latin} numberOfLines={1}>
              {latinRoom}
            </Text>
          </View>
          <IconButton
            accessibilityLabel={t('plant.moreA11y')}
            onPress={() => setMenu(true)}
            icon={(c) => <IconMore color={c} />}
          />
        </View>

        <MascotScene
          name={plant.nickname}
          speciesId={plant.speciesId}
          stage={s.stage}
          thirsty={s.thirsty}
          bubble={moodBubble(s, justWatered)}
          dropsKey={drops}
        />

        <View style={styles.content}>
          <Rise delay="d1" style={styles.tiles}>
            <InfoTile title={t('plant.water')} value={s.waterText}>
              <WaterGauge level={s.waterLevel} />
            </InfoTile>
            <InfoTile title={t('plant.light')} value={plant.lightLabel}>
              <IconSun />
            </InfoTile>
            <InfoTile title={t('plant.air')} value={plant.air}>
              <IconAir />
            </InfoTile>
          </Rise>

          <Rise delay="d2">
            <Button
              label={s.wateredToday ? t('plant.undoBtn') : t('plant.wateredBtn')}
              variant={s.wateredToday ? 'sage' : 'sun'}
              size="water"
              popKey={s.wateredToday ? 'watered' : 'thirsty'}
              icon={(c) => <IconDrop size={20} color={c} />}
              onPress={toggleWater}
            />
          </Rise>

          <Rise delay="d3" style={styles.card}>
            <View style={styles.growthHeader}>
              <Text style={styles.overline}>{t('plant.growth')}</Text>
              <Text style={styles.since}>
                {t('plant.since', { since: sinceText(s.daysSinceCreated) })}
              </Text>
            </View>
            <GrowthSteps stage={s.stage} />
          </Rise>

          <Rise delay="d3" style={[styles.card, styles.tipCard]}>
            <Text style={styles.overline}>{t('plant.tip')}</Text>
            <Text style={styles.tip}>{plant.tip}</Text>
          </Rise>

          <Rise delay="d4">
            <PressableScale
              onPress={() => go('chat', { id: plant.id })}
              accessibilityRole="button"
              accessibilityLabel={t('plant.chatA11y', { name: plant.nickname })}
              style={styles.chatCard}
            >
              <View style={styles.chatTexts}>
                <Text style={styles.chatTitle}>
                  {t('plant.chatTitle', { name: plant.nickname })}
                </Text>
                <Text style={styles.chatText}>{t('plant.chatText')}</Text>
              </View>
              <View style={styles.chatIcon}>
                <IconCamera size={20} color={colors.bg} />
              </View>
            </PressableScale>
          </Rise>
        </View>
      </ScrollView>

      <PlantOptionsSheet
        key={`${plant.nickname}-${plant.waterEveryDays}-${plant.roomId}`}
        plant={plant}
        visible={menu}
        onClose={() => setMenu(false)}
        onDeleted={() => go('garden', { replace: true, anim: 'back' })}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: space.x4 + 2 },
  header: {
    paddingTop: space.xs,
    paddingHorizontal: layout.screenPadDetail,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titles: { flex: 1, alignItems: 'center', paddingHorizontal: space.s },
  name: { ...type.plantName, color: colors.forest },
  // Marge : l'italique déborde de sa boîte et serait rogné en fin de ligne.
  latin: { ...type.caption, fontStyle: 'italic', color: colors.inkMuted, paddingHorizontal: 2 },
  notFound: {
    ...type.body,
    color: colors.inkMuted,
    textAlign: 'center',
    marginTop: space.x5,
    paddingHorizontal: layout.screenPadDetail,
  },
  content: {
    paddingTop: layout.screenPadDetail,
    paddingHorizontal: layout.screenPadDetail,
    gap: space.ml,
  },
  tiles: { flexDirection: 'row', gap: space.sm },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: space.ml,
    paddingHorizontal: space.ml + 2,
    gap: space.m,
  },
  tipCard: { gap: space.s },
  growthHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  overline: { ...type.overline, color: colors.inkMuted },
  since: { ...type.caption, color: colors.inkMuted, flexShrink: 1, textAlign: 'right' },
  tip: { ...type.small, color: colors.ink },
  chatCard: {
    backgroundColor: colors.sage,
    borderRadius: radius.lg,
    paddingVertical: space.m,
    paddingRight: space.m,
    paddingLeft: space.ml + 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.m,
  },
  chatTexts: { flex: 1 },
  chatTitle: { ...type.sectionTitle, color: colors.forest },
  chatText: { ...type.caption, color: colors.forestText },
  chatIcon: {
    width: control.roundIcon,
    height: control.roundIcon,
    borderRadius: control.roundIcon / 2,
    backgroundColor: colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
