import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { IconPlus } from '@/components/icons';
import { LightOption } from '@/components/LightOption';
import { Rise } from '@/components/Rise';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { TextField } from '@/components/TextField';
import { showToast } from '@/components/Toast';
import { loadLastRoom, useCreatePlant, useCreateRoom } from '@/features/newPlant/api';
import { useNewPlantDraft } from '@/features/newPlant/draftStore';
import { SpeciesPicker } from '@/features/newPlant/SpeciesPicker';
import { useRecognition } from '@/features/newPlant/useRecognition';
import { useRooms } from '@/features/plant/api';
import { t } from '@/i18n';
import { go, goBack } from '@/motion/transitions';
import { FORM_INFO, LIGHT_TIPS, type Light } from '@/plants/careInfo';
import { SPECIES_BY_ID } from '@/plants/species';
import { colors, layout, space, type } from '@/theme';

const LIGHTS: { id: Light; label: string; hint: string }[] = [
  { id: 'ombre', label: t('newPlant.lightShade'), hint: t('newPlant.lightShadeHint') },
  { id: 'indirect', label: t('newPlant.lightBright'), hint: t('newPlant.lightBrightHint') },
  { id: 'soleil', label: t('newPlant.lightSun'), hint: t('newPlant.lightSunHint') },
];
const NAME_MAX = 24;
const DEFAULT_ROOM = 'Salon';

/** Nouvelle plante (docs/04 §11), ouverte uniquement depuis le + du jardin. */
export default function NewPlantScreen() {
  const insets = useSafeAreaInsets();
  const draft = useNewPlantDraft();
  const rooms = useRooms();
  const create = useCreatePlant();
  const recognize = useRecognition();
  const [roomSheet, setRoomSheet] = useState(false);

  // Pièce par défaut : la dernière utilisée, sinon Salon (docs/06 F6).
  useEffect(() => {
    if (draft.roomId || !rooms.data?.length) return;
    void loadLastRoom().then((last) => {
      const list = rooms.data ?? [];
      const room =
        list.find((r) => r.id === last) ?? list.find((r) => r.name === DEFAULT_ROOM) ?? list[0];
      if (room && !useNewPlantDraft.getState().roomId) draft.set({ roomId: room.id });
    });
  }, [rooms.data, draft]);

  // Retour de la liste des espèces par « Prendre une photo » (aucun résultat).
  useFocusEffect(
    useCallback(() => {
      if (!useNewPlantDraft.getState().wantsPhoto) return;
      useNewPlantDraft.getState().set({ wantsPhoto: false });
      void recognize();
    }, [recognize]),
  );

  const species = draft.speciesId ? SPECIES_BY_ID[draft.speciesId] : undefined;
  const preferred = species ? FORM_INFO[species.form].light : null;
  const lightTip = preferred ? LIGHT_TIPS[`${preferred}>${draft.light}`] : undefined;

  const close = () => {
    draft.reset();
    goBack();
  };

  const add = () => {
    if (!draft.speciesId || create.isPending) return;
    create.mutate(
      {
        speciesId: draft.speciesId,
        source: draft.source ?? 'list',
        name: draft.name,
        roomId: draft.roomId,
        light: draft.light,
        photoPath: draft.photoPath,
      },
      {
        onSuccess: (created) => {
          draft.set({ created });
          go('added', { replace: true });
        },
        onError: () => showToast(t('newPlant.addFailed')),
      },
    );
  };

  return (
    <Screen name="newPlant" enter="up" edges={['top']}>
      <View style={styles.header}>
        <ScreenHeader
          title={t('newPlant.title')}
          onBack={close}
          backLabel={t('newPlant.backA11y')}
        />
      </View>
      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        <SpeciesPicker
          speciesId={draft.speciesId}
          source={draft.source}
          confidence={draft.confidence}
          recognizing={draft.status === 'recognizing'}
          onPhoto={() => void recognize()}
          onList={() => go('species')}
        />

        <TextField
          label={t('newPlant.nameLabel')}
          value={draft.name}
          onChangeText={(name) => draft.set({ name })}
          placeholder={
            species
              ? t('newPlant.namePlaceholder', { species: species.name })
              : t('newPlant.namePlaceholderDefault')
          }
          maxLength={NAME_MAX}
          returnKeyType="done"
        />

        <View style={styles.group}>
          <Text style={styles.label}>{t('newPlant.room')}</Text>
          <View style={styles.chips}>
            {(rooms.data ?? []).map((room) => (
              <Chip
                key={room.id}
                label={room.name}
                variant="room"
                selected={room.id === draft.roomId}
                onPress={() => draft.set({ roomId: room.id })}
              />
            ))}
            <Chip
              label={`+ ${t('newPlant.addRoom')}`}
              variant="room"
              onPress={() => setRoomSheet(true)}
            />
          </View>
        </View>

        <View style={styles.group}>
          <Text style={styles.label}>{t('newPlant.light')}</Text>
          <View style={styles.lights}>
            {LIGHTS.map((l) => (
              <View key={l.id} style={styles.light}>
                <LightOption
                  label={l.label}
                  hint={l.hint}
                  selected={draft.light === l.id}
                  onPress={() => draft.set({ light: l.id })}
                />
              </View>
            ))}
          </View>
          {lightTip && (
            <Rise key={lightTip}>
              <Text style={styles.tip} accessibilityLiveRegion="polite">
                {lightTip}
              </Text>
            </Rise>
          )}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, space.x5) }]}>
        <Button
          label={species ? t('newPlant.add') : t('newPlant.addDisabled')}
          disabled={!species}
          loading={create.isPending}
          icon={(c) => <IconPlus size={20} color={c} strokeWidth={2.4} />}
          onPress={add}
        />
      </View>

      <NewRoomSheet
        visible={roomSheet}
        position={rooms.data?.length ?? 0}
        onClose={() => setRoomSheet(false)}
        onCreated={(roomId) => draft.set({ roomId })}
      />
    </Screen>
  );
}

/** « + Pièce » (non maquetté) : création d'une pièce dans une feuille du bas. */
function NewRoomSheet({
  visible,
  position,
  onClose,
  onCreated,
}: {
  visible: boolean;
  position: number;
  onClose: () => void;
  onCreated: (roomId: string) => void;
}) {
  const [name, setName] = useState('');
  const createRoom = useCreateRoom();
  const save = () =>
    createRoom.mutate(
      { name, position },
      {
        onSuccess: (room) => {
          onCreated(room.id);
          setName('');
          onClose();
        },
        onError: () => showToast(t('toast.offline')),
      },
    );
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.sheet}>
        <TextField
          label={t('newPlant.newRoomTitle')}
          value={name}
          onChangeText={setName}
          placeholder={t('newPlant.newRoomPlaceholder')}
          maxLength={NAME_MAX}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={() => name.trim() && save()}
        />
        <Button
          label={t('common.save')}
          disabled={!name.trim()}
          loading={createRoom.isPending}
          onPress={save}
        />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: space.xs, paddingHorizontal: layout.screenPadDetail },
  form: {
    paddingVertical: space.xl,
    paddingHorizontal: layout.screenPadDetail,
    gap: space.xl,
  },
  group: { gap: space.s },
  label: { ...type.label, color: colors.inkMuted },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.s },
  lights: { flexDirection: 'row', gap: space.s },
  light: { flex: 1 },
  tip: { ...type.caption, color: colors.warnText },
  footer: { paddingTop: space.sm, paddingHorizontal: layout.screenPadDetail },
  sheet: { gap: space.m },
});
