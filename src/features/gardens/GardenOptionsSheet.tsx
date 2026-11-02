import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import { IconChevronRight } from '@/components/icons';
import { TextField } from '@/components/TextField';
import { showToast } from '@/components/Toast';
import { t } from '@/i18n';
import { makeStyles, space, type } from '@/theme';

import { useDeleteGarden, useUpdateGarden, type GardenPlace } from './api';
import type { Garden } from './gardenRules';
import { geocodePlace } from './location';
import { PlaceForm } from './PlaceForm';

type View_ = 'menu' | 'rename' | 'place' | 'delete';

const MENU: { view: Exclude<View_, 'menu'>; key: string; danger?: boolean }[] = [
  { view: 'rename', key: 'gardens.menuRename' },
  { view: 'place', key: 'gardens.menuPlace' },
  { view: 'delete', key: 'gardens.menuDelete', danger: true },
];
const NAME_MAX = 40;

type Props = {
  garden: Garden;
  plantCount: number;
  visible: boolean;
  onClose: () => void;
  /** Après suppression : retour à l'accueil. */
  onDeleted: () => void;
};

/** Menu « … » d'un jardin (non maquetté) : même feuille que le menu de la fiche plante. */
export function GardenOptionsSheet({ garden, plantCount, visible, onClose, onDeleted }: Props) {
  const styles = useStyles();
  const [view, setView] = useState<View_>('menu');
  const [name, setName] = useState(garden.name);
  const [place, setPlace] = useState<GardenPlace>({
    city: garden.city ?? '',
    country: garden.country ?? '',
    countryCode: garden.countryCode,
    latitude: garden.latitude,
    longitude: garden.longitude,
  });
  const [saving, setSaving] = useState(false);
  const update = useUpdateGarden();
  const remove = useDeleteGarden();

  const close = () => {
    onClose();
    setView('menu');
  };
  const done = () => {
    close();
    showToast(t('gardens.savedToast'));
  };
  const failed = () => showToast(t('toast.offline'));

  const savePlace = async () => {
    setSaving(true);
    const located =
      place.latitude === null && place.city.trim()
        ? await geocodePlace(place.city, place.country)
        : place;
    setSaving(false);
    update.mutate({ id: garden.id, place: located }, { onSuccess: done, onError: failed });
  };

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
            label={t('gardens.nameLabel')}
            value={name}
            onChangeText={setName}
            autoFocus
            maxLength={NAME_MAX}
            returnKeyType="done"
          />
          <Button
            label={t('common.save')}
            disabled={!name.trim()}
            loading={update.isPending}
            onPress={() =>
              update.mutate({ id: garden.id, name }, { onSuccess: done, onError: failed })
            }
          />
        </View>
      )}

      {view === 'place' && (
        <View style={styles.panel}>
          <Text style={styles.title}>{t('gardens.placeTitle')}</Text>
          <PlaceForm value={place} onChange={setPlace} />
          <Button
            label={t('common.save')}
            loading={saving || update.isPending}
            onPress={() => void savePlace()}
          />
        </View>
      )}

      {view === 'delete' && (
        <View style={styles.panel}>
          <Text style={styles.confirm}>
            {plantCount === 1
              ? t('gardens.deleteConfirmOne', { name: garden.name })
              : t('gardens.deleteConfirm', { name: garden.name })}
          </Text>
          <Button
            label={t('gardens.menuDelete')}
            loading={remove.isPending}
            onPress={() =>
              remove.mutate(garden.id, {
                onSuccess: () => {
                  close();
                  showToast(t('gardens.deletedToast', { name: garden.name }));
                  onDeleted();
                },
                onError: failed,
              })
            }
          />
          <Button label={t('common.cancel')} variant="secondary" onPress={() => setView('menu')} />
        </View>
      )}
    </BottomSheet>
  );
}

const useStyles = makeStyles((colors) => ({
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
  title: { ...type.sectionTitle, color: colors.forest },
  confirm: { ...type.body, color: colors.ink },
}));
