import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import { IconChevronRight, IconMinus, IconPlus } from '@/components/icons';
import { IconButton } from '@/components/IconButton';
import { TextField } from '@/components/TextField';
import { showToast } from '@/components/Toast';
import { usePlants } from '@/features/garden/api';
import type { GardenPlant } from '@/features/garden/gardenRules';
import { useGardens, useMovePlant } from '@/features/gardens/api';
import { isLastInGarden, type Garden } from '@/features/gardens/gardenRules';
import { t } from '@/i18n';
import { learnRhythm } from '@/plants/wateringModel';
import { makeStyles, space, type } from '@/theme';

import { useUpdatePlant, useWateringHistory } from './api';

type View_ = 'menu' | PlantAction;
/** Actions du menu « … » d'une plante. */
export type PlantAction = 'rename' | 'garden' | 'interval' | 'history' | 'delete';

type Props = {
  plant: GardenPlant;
  visible: boolean;
  onClose: () => void;
  /** Après suppression : retour au jardin. */
  onDeleted: () => void;
  /** Actions proposées (appui long sur une carte : déplacer, supprimer) ; toutes par défaut. */
  only?: PlantAction[];
  /** Ouvre directement une action (actions d'accessibilité de la carte). */
  initialView?: PlantAction;
};

const MENU: { view: Exclude<View_, 'menu'>; key: string; danger?: boolean }[] = [
  { view: 'rename', key: 'plant.menuRename' },
  { view: 'garden', key: 'gardens.move' },
  { view: 'interval', key: 'plant.menuInterval' },
  { view: 'history', key: 'plant.menuHistory' },
  { view: 'delete', key: 'plant.menuDelete', danger: true },
];

const INTERVAL = { min: 1, max: 60 };
const dayFormat = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

/**
 * Menu « … » de la fiche (non maquetté, docs/04 §8) : feuille du bas, lignes au style des Réglages.
 */
export function PlantOptionsSheet({
  plant,
  visible,
  onClose,
  onDeleted,
  only,
  initialView,
}: Props) {
  const styles = useStyles();
  const [view, setView] = useState<View_>(initialView ?? 'menu');
  const [name, setName] = useState(plant.nickname);
  const [every, setEvery] = useState(plant.waterEveryDays);
  const update = useUpdatePlant();
  const { data: gardens = [] } = useGardens();
  const { data: plants = [] } = usePlants();
  const move = useMovePlant();
  const [target, setTarget] = useState<Garden | null>(null);
  const historyQuery = useWateringHistory(plant.id, visible && view === 'history');
  // Pendant le chargement, les arrosages déjà connus de la fiche (mis à jour tout de suite).
  const history = {
    data:
      historyQuery.data ??
      (historyQuery.isPending
        ? plant.history.map((e) => ({ id: e.at.toISOString(), wateredAt: e.at }))
        : undefined),
  };
  const events = history.data ?? [];
  // Rythme observé d'après les arrosages (repère dans « Rythme d'arrosage »).
  const learned = learnRhythm(plant.history, plant.waterEveryDays, plant.drying);
  // Retirer la dernière plante d'un jardin le supprime (jamais de jardin vide) : on le dit avant.
  const last = isLastInGarden(plant, plants);
  // « Changer de jardin » seulement s'il y a un autre jardin.
  const menu = MENU.filter(
    (item) => (!only || only.includes(item.view)) && (item.view !== 'garden' || gardens.length > 1),
  );

  const close = () => {
    onClose();
    setView('menu');
    setTarget(null);
  };
  const moveTo = (garden: Garden) =>
    move.mutate(
      { plantId: plant.id, gardenId: garden.id },
      {
        onSuccess: () => {
          close();
          showToast(t('gardens.movedToast', { name: plant.nickname, garden: garden.name }));
        },
        onError: () => showToast(t('toast.offline')),
      },
    );
  const save = (change: Parameters<typeof update.mutate>[0]['update'], after?: () => void) =>
    update.mutate(
      { plantId: plant.id, update: change },
      {
        onSuccess: () => {
          close();
          if (after) after();
          else showToast(t('plant.savedToast'));
        },
        onError: () => showToast(t('toast.offline')),
      },
    );

  return (
    <BottomSheet visible={visible} onClose={close}>
      {/* Menu court (appui long sur une carte) : on rappelle de quelle plante il s'agit. */}
      {view === 'menu' && only && (
        <Text style={styles.title} accessibilityRole="header">
          {plant.nickname}
        </Text>
      )}
      {view === 'menu' &&
        menu.map((item, i) => (
          <Pressable
            key={item.view}
            onPress={() => setView(item.view)}
            accessibilityRole="button"
            style={[styles.row, i < menu.length - 1 && styles.separator]}
          >
            <Text style={[styles.rowText, item.danger && styles.danger]}>{t(item.key)}</Text>
            {!item.danger && <IconChevronRight />}
          </Pressable>
        ))}

      {view === 'rename' && (
        <View style={styles.panel}>
          <TextField
            label={t('newPlant.nameLabel')}
            value={name}
            onChangeText={setName}
            autoFocus
            maxLength={40}
            returnKeyType="done"
          />
          <Button
            label={t('common.save')}
            disabled={!name.trim()}
            loading={update.isPending}
            onPress={() => save({ nickname: name.trim() })}
          />
        </View>
      )}

      {view === 'garden' && !target && (
        <View>
          <Text style={styles.label}>{t('gardens.move')}</Text>
          {gardens
            .filter((g) => g.id !== plant.gardenId)
            .map((g, i, list) => (
              <Pressable
                key={g.id}
                onPress={() => (last ? setTarget(g) : moveTo(g))}
                disabled={move.isPending}
                accessibilityRole="button"
                style={[styles.row, i < list.length - 1 && styles.separator]}
              >
                <Text style={styles.rowText}>{g.name}</Text>
                <IconChevronRight />
              </Pressable>
            ))}
        </View>
      )}

      {view === 'garden' && target && (
        <View style={styles.panel}>
          <Text style={styles.confirm}>
            {t('gardens.lastPlantMove', { name: plant.nickname, garden: plant.gardenName })}
          </Text>
          <Button
            label={t('gardens.moveConfirm')}
            loading={move.isPending}
            onPress={() => moveTo(target)}
          />
          <Button label={t('common.cancel')} variant="secondary" onPress={() => setTarget(null)} />
        </View>
      )}

      {view === 'interval' && (
        <View style={styles.panel}>
          <Text style={styles.label}>{t('plant.menuInterval')}</Text>
          <View style={styles.stepper}>
            <IconButton
              accessibilityLabel={t('plant.intervalLess')}
              disabled={every <= INTERVAL.min}
              onPress={() => setEvery((n) => Math.max(INTERVAL.min, n - 1))}
              icon={(c) => <IconMinus size={20} color={c} />}
            />
            <Text style={styles.stepValue} accessibilityLiveRegion="polite">
              {every === 1 ? t('plant.intervalValueOne') : t('plant.intervalValue', { n: every })}
            </Text>
            <IconButton
              accessibilityLabel={t('plant.intervalMore')}
              disabled={every >= INTERVAL.max}
              onPress={() => setEvery((n) => Math.min(INTERVAL.max, n + 1))}
              icon={(c) => <IconPlus size={20} color={c} />}
            />
          </View>
          {learned.estimate !== null && learned.stable && (
            <Text style={styles.muted}>{t('rhythm.learned', { n: learned.estimate })}</Text>
          )}
          <Button
            label={t('common.save')}
            loading={update.isPending}
            onPress={() => save({ water_every_days: every })}
          />
        </View>
      )}

      {view === 'history' && (
        <ScrollView style={styles.history}>
          <Text style={styles.label}>{t('plant.menuHistory')}</Text>
          {history.data?.length === 0 && (
            <Text style={styles.muted}>{t('plant.historyEmpty')}</Text>
          )}
          {events.map((event, i) => (
            <View key={event.id} style={[styles.row, i < events.length - 1 && styles.separator]}>
              <Text style={styles.rowText}>{capitalize(dayFormat.format(event.wateredAt))}</Text>
            </View>
          ))}
        </ScrollView>
      )}

      {view === 'delete' && (
        <View style={styles.panel}>
          <Text style={styles.confirm}>{t('plant.deleteConfirm', { name: plant.nickname })}</Text>
          {last && (
            <Text style={styles.confirm}>
              {t('gardens.lastPlantDelete', { name: plant.nickname, garden: plant.gardenName })}
            </Text>
          )}
          <Button
            label={t('plant.menuDelete')}
            loading={update.isPending}
            onPress={() =>
              save({ archived_at: new Date().toISOString() }, () => {
                showToast(t('plant.deletedToast', { name: plant.nickname }));
                onDeleted();
              })
            }
          />
          <Button label={t('common.cancel')} variant="secondary" onPress={() => setView('menu')} />
        </View>
      )}
    </BottomSheet>
  );
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const useStyles = makeStyles((colors) => ({
  title: { ...type.sectionTitle, color: colors.forest, paddingBottom: space.xs },
  row: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.xxs,
  },
  separator: { borderBottomWidth: 1, borderBottomColor: colors.lineSoft },
  rowText: { ...type.bodyS, fontFamily: type.cardTitle.fontFamily, color: colors.ink },
  danger: { color: colors.danger },
  panel: { gap: space.m },
  label: { ...type.label, color: colors.inkMuted },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.s },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepValue: { ...type.cardTitle, color: colors.forest },
  history: { maxHeight: 360 },
  muted: { ...type.small, color: colors.inkMuted, paddingVertical: space.m },
  confirm: { ...type.body, color: colors.ink },
}));
