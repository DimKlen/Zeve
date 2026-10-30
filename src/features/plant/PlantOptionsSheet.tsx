import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { IconChevronRight, IconMinus, IconPlus } from '@/components/icons';
import { IconButton } from '@/components/IconButton';
import { TextField } from '@/components/TextField';
import { showToast } from '@/components/Toast';
import type { GardenPlant } from '@/features/garden/gardenRules';
import { t } from '@/i18n';
import { colors, space, type } from '@/theme';

import { useRooms, useUpdatePlant, useWateringHistory } from './api';

type View_ = 'menu' | 'rename' | 'room' | 'interval' | 'history' | 'delete';

type Props = {
  plant: GardenPlant;
  visible: boolean;
  onClose: () => void;
  /** Après suppression : retour au jardin. */
  onDeleted: () => void;
};

const MENU: { view: Exclude<View_, 'menu'>; key: string; danger?: boolean }[] = [
  { view: 'rename', key: 'plant.menuRename' },
  { view: 'room', key: 'plant.menuRoom' },
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
export function PlantOptionsSheet({ plant, visible, onClose, onDeleted }: Props) {
  const [view, setView] = useState<View_>('menu');
  const [name, setName] = useState(plant.nickname);
  const [every, setEvery] = useState(plant.waterEveryDays);
  const update = useUpdatePlant();
  const rooms = useRooms();
  const history = useWateringHistory(plant.id, visible && view === 'history');

  const close = () => {
    onClose();
    setView('menu');
  };
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
      {view === 'menu' &&
        MENU.map((item, i) => (
          <Pressable
            key={item.view}
            onPress={() => setView(item.view)}
            accessibilityRole="button"
            style={[styles.row, i < MENU.length - 1 && styles.separator]}
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

      {view === 'room' && (
        <View style={styles.panel}>
          <Text style={styles.label}>{t('newPlant.room')}</Text>
          <View style={styles.chips}>
            {(rooms.data ?? []).map((room) => (
              <Chip
                key={room.id}
                label={room.name}
                variant="room"
                selected={room.id === plant.roomId}
                onPress={() => save({ room_id: room.id })}
              />
            ))}
          </View>
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
          {history.data?.map((event, i) => (
            <View
              key={event.id}
              style={[styles.row, i < history.data.length - 1 && styles.separator]}
            >
              <Text style={styles.rowText}>{capitalize(dayFormat.format(event.wateredAt))}</Text>
            </View>
          ))}
        </ScrollView>
      )}

      {view === 'delete' && (
        <View style={styles.panel}>
          <Text style={styles.confirm}>{t('plant.deleteConfirm', { name: plant.nickname })}</Text>
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

const styles = StyleSheet.create({
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
});
