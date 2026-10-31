import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { IconCamera } from '@/components/icons';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { TextField } from '@/components/TextField';
import { useNewPlantDraft } from '@/features/newPlant/draftStore';
import { searchSpecies } from '@/features/newPlant/searchSpecies';
import { SpeciesRow } from '@/features/newPlant/SpeciesRow';
import { t } from '@/i18n';
import { goBack } from '@/motion/transitions';
import { CATEGORIES, FORM_INFO, type Category } from '@/plants/careInfo';
import { SPECIES, type Species } from '@/plants/species';
import { colors, layout, space, type } from '@/theme';

const DEBOUNCE_MS = 120;
const FORM_COUNT = Object.keys(FORM_INFO).length;

/** Liste des espèces (docs/04 §12). */
export default function SpeciesScreen() {
  const selectedId = useNewPlantDraft((s) => s.speciesId);
  const setDraft = useNewPlantDraft((s) => s.set);
  const [input, setInput] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category | 'all'>('all');

  useEffect(() => {
    const timer = setTimeout(() => setQuery(input), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [input]);

  const results = searchSpecies(query, category);
  const filtered = !!query.trim() || category !== 'all';
  const counter = !filtered
    ? t('species.countAll', { count: SPECIES.length, types: FORM_COUNT })
    : results.length === 1
      ? t('species.countOne')
      : t('species.count', { count: results.length });

  const pick = useCallback(
    (species: Species) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setDraft({ speciesId: species.id, source: 'list', confidence: null });
      goBack();
    },
    [setDraft],
  );

  return (
    <Screen name="species" edges={['top']}>
      <View style={styles.header}>
        <ScreenHeader
          title={t('species.title')}
          caption={counter}
          onBack={goBack}
          backLabel={t('newPlant.backA11y')}
        />
        <TextField
          variant="search"
          testID="species-search"
          value={input}
          onChangeText={setInput}
          accessibilityLabel={t('species.searchLabel')}
          placeholder={t('species.searchPlaceholder')}
          autoCorrect={false}
          returnKeyType="search"
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipsScroll}
          contentContainerStyle={styles.chips}
        >
          {CATEGORIES.map((c) => (
            <Chip
              key={c.id}
              label={c.label}
              selected={category === c.id}
              onPress={() => setCategory(c.id)}
            />
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={results}
        keyExtractor={(s) => s.id}
        renderItem={({ item }) => (
          <SpeciesRow species={item} selected={item.id === selectedId} onPress={pick} />
        )}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={12}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>{t('species.emptyTitle')}</Text>
            <Text style={styles.emptyText}>{t('species.emptyText')}</Text>
            <Button
              label={t('species.emptyCta')}
              size="s"
              icon={(c) => <IconCamera size={20} color={c} />}
              onPress={() => {
                setDraft({ wantsPhoto: true });
                goBack();
              }}
            />
          </View>
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: space.xs,
    paddingHorizontal: layout.screenPadDetail,
    paddingBottom: space.m,
    gap: space.ml,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  // Les chips débordent jusqu'aux bords de l'écran.
  chipsScroll: { marginHorizontal: -layout.screenPadDetail },
  chips: { gap: space.s, paddingHorizontal: layout.screenPadDetail },
  list: { paddingTop: space.s, paddingHorizontal: space.m, paddingBottom: 30 },
  empty: { alignItems: 'center', gap: space.s, paddingTop: 60, paddingHorizontal: space.xl },
  emptyTitle: { ...type.cardTitle, fontFamily: type.button.fontFamily, color: colors.forest },
  emptyText: { ...type.small, color: colors.inkMuted, textAlign: 'center', marginBottom: space.s },
});
