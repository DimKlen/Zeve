import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { KeyboardAvoidingView, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { IconPlus, IconShuffle } from '@/components/icons';
import { IconButton } from '@/components/IconButton';
import { LightOption } from '@/components/LightOption';
import { Rise } from '@/components/Rise';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { TextField } from '@/components/TextField';
import { showToast } from '@/components/Toast';
import { usePlants } from '@/features/garden/api';
import { useGardens, type GardenPlace } from '@/features/gardens/api';
import { DEFAULT_ROOMS, defaultGardenName, type Garden } from '@/features/gardens/gardenRules';
import { geocodePlace } from '@/features/gardens/location';
import { EMPTY_PLACE, PlaceForm } from '@/features/gardens/PlaceForm';
import {
  loadLastGarden,
  loadLastRoom,
  useCreatePlant,
  useCreateRoom,
} from '@/features/newPlant/api';
import { useNewPlantDraft } from '@/features/newPlant/draftStore';
import { suggestName } from '@/features/newPlant/plantNames';
import { SpeciesPicker } from '@/features/newPlant/SpeciesPicker';
import { useRecognition } from '@/features/newPlant/useRecognition';
import { useRooms } from '@/features/plant/api';
import { t } from '@/i18n';
import { go, goBack } from '@/motion/transitions';
import { FORM_INFO, LIGHT_TIPS, type Light } from '@/plants/careInfo';
import { SPECIES_BY_ID } from '@/plants/species';
import { layout, makeStyles, space, type } from '@/theme';

const LIGHTS: { id: Light; label: string; hint: string }[] = [
  { id: 'ombre', label: t('newPlant.lightShade'), hint: t('newPlant.lightShadeHint') },
  { id: 'indirect', label: t('newPlant.lightBright'), hint: t('newPlant.lightBrightHint') },
  { id: 'soleil', label: t('newPlant.lightSun'), hint: t('newPlant.lightSunHint') },
];
const NAME_MAX = 24;
const GARDEN_NAME_MAX = 40;
const DEFAULT_ROOM = 'Salon';

/** Nouvelle plante (docs/04 §11), ouverte uniquement depuis le + du jardin. */
export default function NewPlantScreen() {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const draft = useNewPlantDraft();
  const { data: gardens } = useGardens();
  const { data: plants } = usePlants();
  const rooms = useRooms();
  const create = useCreatePlant();
  const recognize = useRecognition();
  const [roomSheet, setRoomSheet] = useState(false);
  const [gardenSheet, setGardenSheet] = useState(false);

  const garden = draft.garden;
  const gardenId = garden?.kind === 'existing' ? garden.id : null;
  const gardenRooms = (rooms.data ?? []).filter((r) => r.gardenId === gardenId);
  // Noms déjà portés dans le jardin choisi : jamais suggérés.
  const taken = (plants ?? []).filter((p) => p.gardenId === gardenId).map((p) => p.nickname);

  // Jardin par défaut : celui d'où part l'ajout, sinon le dernier utilisé ; aucun → nouveau jardin.
  useEffect(() => {
    if (!gardens || useNewPlantDraft.getState().garden) return;
    if (!gardens.length) {
      draft.set({
        garden: { kind: 'new', name: defaultGardenName(null, []), place: null },
        roomName: DEFAULT_ROOM,
      });
      return;
    }
    void loadLastGarden().then((last) => {
      const chosen = gardens.find((g) => g.id === last) ?? gardens[0]!;
      if (!useNewPlantDraft.getState().garden)
        draft.set({ garden: { kind: 'existing', id: chosen.id } });
    });
  }, [gardens, draft]);

  // Pièce par défaut dans le jardin choisi : la dernière utilisée, sinon Salon (docs/06 F6).
  useEffect(() => {
    if (!gardenId || !rooms.data) return;
    const list = rooms.data.filter((r) => r.gardenId === gardenId);
    if (list.some((r) => r.id === useNewPlantDraft.getState().roomId)) return;
    void loadLastRoom().then((last) => {
      const room =
        list.find((r) => r.id === last) ?? list.find((r) => r.name === DEFAULT_ROOM) ?? list[0];
      draft.set({ roomId: room?.id ?? null });
    });
  }, [gardenId, rooms.data, draft]);

  // Nom suggéré dès l'ouverture (modifiable, « Autre nom » en propose un autre).
  useEffect(() => {
    if (!plants || !garden || useNewPlantDraft.getState().suggestedName !== null) return;
    const name = suggestName(taken);
    draft.set({ name, suggestedName: name });
  }, [plants, garden, taken, draft]);

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

  const otherName = () => {
    const name = suggestName(taken, draft.name);
    draft.set({ name, suggestedName: name });
  };

  const add = () => {
    if (!draft.speciesId || !garden || create.isPending) return;
    create.mutate(
      {
        speciesId: draft.speciesId,
        source: draft.source ?? 'list',
        name: draft.name,
        garden,
        roomId: garden.kind === 'existing' ? draft.roomId : null,
        roomName: garden.kind === 'new' ? draft.roomName : null,
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
      {/* Clavier (nom de la plante) : la page et le CTA du pied remontent, Android compris. */}
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
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

          <View style={styles.nameRow}>
            <View style={styles.flex}>
              <TextField
                label={t('newPlant.nameLabel')}
                testID="plant-name"
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
            </View>
            <IconButton
              accessibilityLabel={t('newPlant.otherName')}
              onPress={otherName}
              size={50}
              icon={(c) => <IconShuffle size={20} color={c} />}
            />
          </View>

          <View style={styles.group}>
            <Text style={styles.label}>{t('newPlant.gardenLabel')}</Text>
            <View style={styles.chips}>
              {(gardens ?? []).map((g) => (
                <Chip
                  key={g.id}
                  label={g.name}
                  variant="room"
                  selected={gardenId === g.id}
                  onPress={() => draft.set({ garden: { kind: 'existing', id: g.id } })}
                />
              ))}
              {garden?.kind === 'new' ? (
                <Chip
                  label={garden.name}
                  variant="room"
                  selected
                  onPress={() => setGardenSheet(true)}
                />
              ) : (
                <Chip
                  label={`+ ${t('gardens.newGarden')}`}
                  variant="room"
                  onPress={() => setGardenSheet(true)}
                />
              )}
            </View>
            {garden?.kind === 'new' && (
              <Text style={styles.hint}>
                {garden.place?.city ? t('gardens.newGardenText') : t('gardens.newGardenHint')}
              </Text>
            )}
          </View>

          <View style={styles.group}>
            <Text style={styles.label}>{t('newPlant.room')}</Text>
            <View style={styles.chips}>
              {garden?.kind === 'new'
                ? DEFAULT_ROOMS.map((name) => (
                    <Chip
                      key={name}
                      label={name}
                      variant="room"
                      selected={name === draft.roomName}
                      onPress={() => draft.set({ roomName: name })}
                    />
                  ))
                : gardenRooms.map((room) => (
                    <Chip
                      key={room.id}
                      label={room.name}
                      variant="room"
                      selected={room.id === draft.roomId}
                      onPress={() => draft.set({ roomId: room.id })}
                    />
                  ))}
              {/* Les pièces d'un nouveau jardin sont créées avec lui : en ajouter ensuite. */}
              {gardenId && (
                <Chip
                  label={`+ ${t('newPlant.addRoom')}`}
                  variant="room"
                  onPress={() => setRoomSheet(true)}
                />
              )}
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
            disabled={!species || !garden}
            loading={create.isPending}
            icon={(c) => <IconPlus size={20} color={c} strokeWidth={2.4} />}
            onPress={add}
          />
        </View>
      </KeyboardAvoidingView>

      {gardenId && (
        <NewRoomSheet
          visible={roomSheet}
          gardenId={gardenId}
          position={gardenRooms.length}
          onClose={() => setRoomSheet(false)}
          onCreated={(roomId) => draft.set({ roomId })}
        />
      )}
      <NewGardenSheet
        key={gardenSheet ? 'open' : 'closed'}
        visible={gardenSheet}
        gardens={gardens ?? []}
        initial={garden?.kind === 'new' ? garden : null}
        onClose={() => setGardenSheet(false)}
        onSave={(name, place) => {
          draft.set({
            garden: { kind: 'new', name, place },
            roomId: null,
            roomName: useNewPlantDraft.getState().roomName ?? DEFAULT_ROOM,
          });
          setGardenSheet(false);
        }}
      />
    </Screen>
  );
}

/**
 * « + Nouveau jardin » (non maquetté) : lieu et nom. Le jardin n'est créé qu'avec la plante
 * (« Ajouter au jardin ») : un jardin vide n'existe jamais.
 */
function NewGardenSheet({
  visible,
  gardens,
  initial,
  onClose,
  onSave,
}: {
  visible: boolean;
  gardens: Garden[];
  initial: { name: string; place: GardenPlace | null } | null;
  onClose: () => void;
  onSave: (name: string, place: GardenPlace | null) => void;
}) {
  const styles = useStyles();
  const names = gardens.map((g) => g.name);
  const [place, setPlace] = useState<GardenPlace>(initial?.place ?? EMPTY_PLACE);
  const [name, setName] = useState(initial?.name ?? defaultGardenName(null, names));
  // Tant que le nom n'a pas été retouché, il suit la ville (« Montréal 1 »).
  const [nameEdited, setNameEdited] = useState(!!initial);
  const [saving, setSaving] = useState(false);

  const changePlace = (next: GardenPlace) => {
    setPlace(next);
    if (!nameEdited) setName(defaultGardenName(next.city, names));
  };
  const save = async () => {
    setSaving(true);
    const located =
      place.latitude === null && place.city.trim()
        ? await geocodePlace(place.city, place.country)
        : place;
    setSaving(false);
    onSave(name.trim(), located.city.trim() || located.latitude !== null ? located : null);
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.sheet}>
        <View>
          <Text style={styles.sheetTitle}>{t('gardens.newGardenTitle')}</Text>
          <Text style={styles.hint}>{t('gardens.newGardenText')}</Text>
        </View>
        <PlaceForm value={place} onChange={changePlace} />
        <TextField
          label={t('gardens.nameLabel')}
          testID="garden-name"
          value={name}
          onChangeText={(value) => {
            setName(value);
            setNameEdited(true);
          }}
          maxLength={GARDEN_NAME_MAX}
          returnKeyType="done"
        />
        <Button
          label={t('gardens.save')}
          disabled={!name.trim()}
          loading={saving}
          onPress={() => void save()}
        />
      </View>
    </BottomSheet>
  );
}

/** « + Pièce » (non maquetté) : création d'une pièce dans une feuille du bas. */
function NewRoomSheet({
  visible,
  gardenId,
  position,
  onClose,
  onCreated,
}: {
  visible: boolean;
  gardenId: string;
  position: number;
  onClose: () => void;
  onCreated: (roomId: string) => void;
}) {
  const styles = useStyles();
  const [name, setName] = useState('');
  const createRoom = useCreateRoom();
  const save = () =>
    createRoom.mutate(
      { name, position, gardenId },
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

const useStyles = makeStyles((colors) => ({
  flex: { flex: 1 },
  header: { paddingTop: space.xs, paddingHorizontal: layout.screenPadDetail },
  form: {
    paddingVertical: space.xl,
    paddingHorizontal: layout.screenPadDetail,
    gap: space.xl,
  },
  group: { gap: space.s },
  label: { ...type.label, color: colors.inkMuted },
  hint: { ...type.caption, color: colors.inkMuted },
  nameRow: { flexDirection: 'row', alignItems: 'flex-end', gap: space.s },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.s },
  lights: { flexDirection: 'row', gap: space.s },
  light: { flex: 1 },
  tip: { ...type.caption, color: colors.warnText },
  footer: { paddingTop: space.sm, paddingHorizontal: layout.screenPadDetail },
  sheet: { gap: space.m },
  sheetTitle: { ...type.subTitle, color: colors.forest },
}));
