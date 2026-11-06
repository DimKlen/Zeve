import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { KeyboardAvoidingView, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { IconPlus, IconShuffle } from '@/components/icons';
import { IconButton } from '@/components/IconButton';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { TextField } from '@/components/TextField';
import { showToast } from '@/components/Toast';
import { usePlants } from '@/features/garden/api';
import { useGardens, type GardenPlace } from '@/features/gardens/api';
import { defaultGardenName, type Garden } from '@/features/gardens/gardenRules';
import { geocodePlace } from '@/features/gardens/location';
import { EMPTY_PLACE, PlaceForm } from '@/features/gardens/PlaceForm';
import { loadLastGarden, useCreatePlant } from '@/features/newPlant/api';
import { useNewPlantDraft } from '@/features/newPlant/draftStore';
import { suggestName } from '@/features/newPlant/plantNames';
import { SpeciesPicker } from '@/features/newPlant/SpeciesPicker';
import { useRecognition } from '@/features/newPlant/useRecognition';
import { t } from '@/i18n';
import { go, goBack } from '@/motion/transitions';
import { SPECIES_BY_ID } from '@/plants/species';
import { layout, makeStyles, space, type } from '@/theme';

const NAME_MAX = 24;
const GARDEN_NAME_MAX = 40;

/** Nouvelle plante (docs/04 §11), ouverte uniquement depuis le + du jardin. */
export default function NewPlantScreen() {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const draft = useNewPlantDraft();
  const { data: gardens } = useGardens();
  const { data: plants } = usePlants();
  const create = useCreatePlant();
  const recognize = useRecognition();
  const [gardenSheet, setGardenSheet] = useState(false);

  const garden = draft.garden;
  const gardenId = garden?.kind === 'existing' ? garden.id : null;
  // Noms déjà portés dans le jardin choisi : jamais suggérés.
  const taken = (plants ?? []).filter((p) => p.gardenId === gardenId).map((p) => p.nickname);

  // Jardin par défaut : celui d'où part l'ajout, sinon le dernier utilisé ; aucun → nouveau jardin.
  useEffect(() => {
    if (!gardens || useNewPlantDraft.getState().garden) return;
    if (!gardens.length) {
      draft.set({ garden: { kind: 'new', name: defaultGardenName(null, []), place: null } });
      return;
    }
    void loadLastGarden().then((last) => {
      const chosen = gardens.find((g) => g.id === last) ?? gardens[0]!;
      if (!useNewPlantDraft.getState().garden)
        draft.set({ garden: { kind: 'existing', id: chosen.id } });
    });
  }, [gardens, draft]);

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
            onRemove={() =>
              draft.set({ speciesId: null, source: null, confidence: null, photoPath: null })
            }
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
              icon={(c) => <IconShuffle size={22} color={c} />}
            />
          </View>

          <View style={styles.group}>
            <Text style={styles.label}>{t('newPlant.gardenLabel')}</Text>
            <View style={styles.chips}>
              {(gardens ?? []).map((g) => (
                <Chip
                  key={g.id}
                  label={g.name}
                  variant="option"
                  selected={gardenId === g.id}
                  onPress={() => draft.set({ garden: { kind: 'existing', id: g.id } })}
                />
              ))}
              {garden?.kind === 'new' ? (
                <Chip
                  label={garden.name}
                  variant="option"
                  selected
                  onPress={() => setGardenSheet(true)}
                />
              ) : (
                <Chip
                  label={`+ ${t('gardens.newGarden')}`}
                  variant="option"
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

      <NewGardenSheet
        key={gardenSheet ? 'open' : 'closed'}
        visible={gardenSheet}
        gardens={gardens ?? []}
        initial={garden?.kind === 'new' ? garden : null}
        onClose={() => setGardenSheet(false)}
        onSave={(name, place) => {
          draft.set({ garden: { kind: 'new', name, place } });
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
  footer: { paddingTop: space.sm, paddingHorizontal: layout.screenPadDetail },
  sheet: { gap: space.m },
  sheetTitle: { ...type.subTitle, color: colors.forest },
}));
