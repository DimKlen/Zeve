import { Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { Button } from '@/components/Button';
import { IconCamera, IconSearch } from '@/components/icons';
import { PressableScale } from '@/components/PressableScale';
import { Rise } from '@/components/Rise';
import { Spinner } from '@/components/Spinner';
import { t } from '@/i18n';
import { usePop } from '@/motion/useEnter';
import { PlantAvatar } from '@/plants/PlantAvatar';
import { SPECIES, SPECIES_BY_ID } from '@/plants/species';
import { makeStyles, radius, space, type, useColors } from '@/theme';

import { typeLabel } from './searchSpecies';

const UNSURE_BELOW = 0.6;
const BLOCK_H = 140;

type Props = {
  speciesId: string | null;
  source: 'photo' | 'list' | null;
  confidence: number | null;
  recognizing: boolean;
  onPhoto: () => void;
  onList: () => void;
};

/** Bloc « Espèce » de Nouvelle plante (docs/04 §11) : choix, reconnaissance, carte d'espèce. */
export function SpeciesPicker({
  speciesId,
  source,
  confidence,
  recognizing,
  onPhoto,
  onList,
}: Props) {
  const colors = useColors();
  const styles = useStyles();
  if (recognizing) {
    return (
      <View
        style={styles.recognizing}
        accessibilityRole="progressbar"
        accessibilityLiveRegion="polite"
      >
        <Spinner />
        <Text style={styles.recognizingText}>{t('newPlant.recognizing')}</Text>
      </View>
    );
  }

  const species = speciesId ? SPECIES_BY_ID[speciesId] : undefined;
  if (!species) {
    return (
      <View style={styles.block}>
        <Text style={styles.label}>{t('newPlant.speciesQuestion')}</Text>
        <View style={styles.choices}>
          <Rise style={styles.choice}>
            <PressableScale
              onPress={onPhoto}
              accessibilityRole="button"
              accessibilityLabel={`${t('newPlant.photo')}, ${t('newPlant.photoHint')}`}
              style={[styles.choiceBox, styles.photoBox]}
            >
              <IconCamera size={30} color={colors.forest} />
              <Text style={styles.choiceTitle}>{t('newPlant.photo')}</Text>
              <Text style={styles.photoHint}>{t('newPlant.photoHint')}</Text>
            </PressableScale>
          </Rise>
          <Rise delay="d1" style={styles.choice}>
            <PressableScale
              onPress={onList}
              accessibilityRole="button"
              accessibilityLabel={`${t('newPlant.list')}, ${t('newPlant.listHint', { count: SPECIES.length })}`}
              style={[styles.choiceBox, styles.listBox]}
            >
              <IconSearch size={30} color={colors.forest} />
              <Text style={styles.choiceTitle}>{t('newPlant.list')}</Text>
              <Text style={styles.listHint}>
                {t('newPlant.listHint', { count: SPECIES.length })}
              </Text>
            </PressableScale>
          </Rise>
        </View>
      </View>
    );
  }

  return (
    <SpeciesCard
      key={species.id}
      speciesId={species.id}
      title={source === 'photo' ? t('newPlant.recognized') : t('newPlant.chosen')}
      unsure={source === 'photo' && confidence !== null && confidence < UNSURE_BELOW}
      onChange={onList}
    />
  );
}

function SpeciesCard({
  speciesId,
  title,
  unsure,
  onChange,
}: {
  speciesId: string;
  title: string;
  unsure: boolean;
  onChange: () => void;
}) {
  const styles = useStyles();
  const species = SPECIES_BY_ID[speciesId]!;
  const pop = usePop(speciesId, true);
  return (
    <View style={styles.block}>
      <Text style={styles.label}>{title}</Text>
      <Animated.View style={[styles.card, pop]}>
        <View
          style={styles.thumb}
          importantForAccessibility="no-hide-descendants"
          accessibilityElementsHidden
        >
          <PlantAvatar speciesId={species.id} stage={3} size={66} />
        </View>
        <View style={styles.cardTexts} accessible>
          <Text style={styles.name}>{species.name}</Text>
          <Text style={styles.latin}>{species.latin}</Text>
          <Text style={styles.type}>{typeLabel(species)}</Text>
        </View>
        <ChangeButton onPress={onChange} />
      </Animated.View>
      {unsure && <Text style={styles.unsure}>{t('newPlant.unsure')}</Text>}
    </View>
  );
}

/** « Changer » : contour strongBorder, h 44, pilule. */
function ChangeButton({ onPress }: { onPress: () => void }) {
  const styles = useStyles();
  return (
    <View style={styles.change}>
      <Button
        label={t('newPlant.change')}
        variant="outline"
        size="s"
        onPress={onPress}
        accessibilityHint={t('newPlant.changeA11y')}
      />
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  block: { gap: space.s },
  label: { ...type.label, color: colors.inkMuted },
  choices: { flexDirection: 'row', gap: space.sm },
  choice: { flex: 1 },
  choiceBox: {
    height: BLOCK_H,
    borderRadius: radius.card,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xs,
    paddingHorizontal: space.s,
  },
  photoBox: {
    backgroundColor: colors.sagePale,
    borderColor: colors.sageLine,
    borderStyle: 'dashed',
  },
  listBox: { backgroundColor: colors.surface, borderColor: colors.inputBorder },
  choiceTitle: { ...type.sectionTitle, color: colors.forest, textAlign: 'center' },
  photoHint: { ...type.micro, color: colors.forestText, textAlign: 'center' },
  listHint: { ...type.micro, color: colors.inkMuted, textAlign: 'center' },
  recognizing: {
    height: BLOCK_H,
    borderRadius: radius.card,
    backgroundColor: colors.sageDeep,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.m,
  },
  recognizingText: { ...type.bodyS, fontFamily: type.cardTitle.fontFamily, color: colors.forest },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: space.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.m,
  },
  thumb: {
    width: 72,
    height: 76,
    borderRadius: radius.md,
    backgroundColor: colors.well,
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  cardTexts: { flex: 1 },
  name: { ...type.cardTitle, fontFamily: type.button.fontFamily, color: colors.ink },
  latin: { ...type.caption, fontStyle: 'italic', color: colors.inkMuted, paddingRight: 2 },
  type: { ...type.micro, color: colors.forestText },
  change: { flexShrink: 0 },
  unsure: { ...type.caption, color: colors.warnText },
}));
