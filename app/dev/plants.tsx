import { FlatList, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { TextButton } from '@/components/TextButton';
import { t } from '@/i18n';
import { go } from '@/motion/transitions';
import { FORM_INFO } from '@/plants/careInfo';
import { PlantAvatar } from '@/plants/PlantAvatar';
import { PLANT_FORMS, type PlantForm } from '@/plants/plantForms.generated';
import { SPECIES } from '@/plants/species';
import { colors, radius, space, type } from '@/theme';

// Planche des dessins (docs/10, design/screens/15-planche-dessins.png) : 19 types × 3 tailles.
const FORMS = Object.keys(PLANT_FORMS) as PlantForm[];
const ROWS = FORMS.map((form) => {
  const species = SPECIES.filter((s) => s.form === form);
  return { form, label: FORM_INFO[form].label, sample: species[0]!.id, examples: species };
});
const STAGES = [1, 2, 3] as const;

const PAD = 48;
const GAP = 16;
const CARD_MIN = 200;

export default function DevPlantsScreen() {
  const { width } = useWindowDimensions();
  const pad = width < 600 ? space.l : PAD;
  const columns = Math.max(1, Math.min(5, Math.floor((width - pad * 2 + GAP) / (CARD_MIN + GAP))));
  // Largeur fixe : la dernière rangée incomplète garde des cartes de même taille (grille du prototype).
  const cardWidth = (width - pad * 2 - GAP * (columns - 1)) / columns;

  return (
    <Screen name="devPlants">
      <FlatList
        key={columns}
        data={ROWS}
        numColumns={columns}
        keyExtractor={(row) => row.form}
        contentContainerStyle={[styles.list, { padding: pad }]}
        columnWrapperStyle={columns > 1 ? styles.columns : undefined}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title} accessibilityRole="header">
              {t('dev.plantsTitle')}
            </Text>
            <Text style={styles.subtitle}>
              {t('dev.plantsSubtitle', { forms: FORMS.length, species: SPECIES.length })}
            </Text>
            <View style={styles.legend}>
              {STAGES.map((stage) => (
                <Text key={stage} style={styles.legendItem}>
                  <Text style={styles.legendStrong}>{t(`stage.${stage}`)}</Text>
                  {` · ${t(`dev.stageLegend${stage}`)}`}
                </Text>
              ))}
            </View>
            <TextButton label={t('dev.kitchenLink')} onPress={() => go('devKitchen')} />
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.card, { width: cardWidth }]}>
            <View style={styles.well}>
              {STAGES.map((stage) => (
                <PlantAvatar
                  key={stage}
                  speciesId={item.sample}
                  stage={stage}
                  size={60}
                  face="simple"
                  sway={false}
                />
              ))}
            </View>
            <Text style={styles.label}>{item.label}</Text>
            <Text style={styles.examples}>{item.examples.map((s) => s.name).join(', ')}</Text>
          </View>
        )}
        ListFooterComponent={<View style={styles.footer} />}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: GAP },
  columns: { gap: GAP },
  header: { gap: space.xs, marginBottom: space.m },
  title: { ...type.catalog, color: colors.forest },
  subtitle: { ...type.body, color: colors.inkMuted },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: space.ml + 2, marginTop: space.m },
  legendItem: { ...type.small, color: colors.inkSoft },
  legendStrong: { fontFamily: type.sectionTitle.fontFamily },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    paddingTop: space.ml,
    paddingHorizontal: space.ml,
    paddingBottom: space.ml + 2,
    gap: space.sm,
  },
  well: {
    height: 104,
    borderRadius: radius.sm,
    backgroundColor: colors.well,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 2,
    paddingHorizontal: space.xxs,
  },
  label: { ...type.sectionTitle, color: colors.forest },
  examples: { ...type.micro, color: colors.inkMuted },
  footer: { height: space.x5 },
});
