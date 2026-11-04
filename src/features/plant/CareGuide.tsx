import type { ReactElement } from 'react';
import { ScrollView, Text, useWindowDimensions, View } from 'react-native';

import { BottomSheet } from '@/components/BottomSheet';
import {
  IconAir,
  IconDrop,
  IconLayers,
  IconPot,
  IconRepot,
  IconSprout,
  IconSun,
  IconThermometer,
} from '@/components/icons';
import { TextButton } from '@/components/TextButton';
import { waterEveryDaysOf } from '@/features/newPlant/searchSpecies';
import { t } from '@/i18n';
import { FORM_INFO, type Light } from '@/plants/careInfo';
import { careGuideOf } from '@/plants/careGuide';
import { climateOf } from '@/plants/seasons';
import { SPECIES_BY_ID } from '@/plants/species';
import { makeStyles, radius, space, type, useColors } from '@/theme';

const LIGHT_TEXT: Record<Light, string> = {
  ombre: 'care.lightOmbre',
  indirect: 'care.lightIndirect',
  soleil: 'care.lightSoleil',
};
/** Plantes de pleine terre : conseils de jardin, pas d'appartement. */
const LIGHT_TEXT_GROUND: Record<Light, string> = {
  ombre: 'care.lightGroundOmbre',
  indirect: 'care.lightGroundIndirect',
  soleil: 'care.lightGroundSoleil',
};
const SHEET_MAX = 0.68;

/** Degrés avec un vrai signe moins (« −10 »). */
const degrees = (n: number) => (n < 0 ? `−${-n}` : String(n));

/**
 * Repères d'entretien en une ligne (arrosage, lumière, température) et lien vers le guide complet.
 * Sous la carte d'espèce de Nouvelle plante (non maquetté, docs/04 « Non maquetté »).
 */
export function CareSummary({ speciesId, onOpen }: { speciesId: string; onOpen: () => void }) {
  const colors = useColors();
  const styles = useStyles();
  const species = SPECIES_BY_ID[speciesId];
  if (!species) return null;
  const info = FORM_INFO[species.form];
  const climate = climateOf(speciesId);
  const every = waterEveryDaysOf(species);
  const min = degrees(climate.ideal[0]);
  const max = degrees(climate.ideal[1]);
  const icon = colors.forest2;
  return (
    <View style={styles.summary}>
      <View
        style={styles.pills}
        accessible
        accessibilityLabel={t('care.summaryA11y', { every, light: info.lightLabel, min, max })}
      >
        <Pill
          icon={<IconDrop size={14} color={icon} />}
          text={t('care.everyShort', { n: every })}
        />
        <Pill icon={<IconSun size={14} color={icon} />} text={info.lightLabel} />
        <Pill
          icon={<IconThermometer size={14} color={icon} />}
          text={t('care.tempShort', { min, max })}
        />
      </View>
      <View style={styles.link}>
        <TextButton label={t('care.guideOpen')} onPress={onOpen} />
      </View>
    </View>
  );
}

function Pill({ icon, text }: { icon: ReactElement; text: string }) {
  const styles = useStyles();
  return (
    <View style={styles.pill}>
      {icon}
      <Text style={styles.pillText} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
}

type SheetProps = {
  speciesId: string;
  /** Prénom de la plante, ou nom de l'espèce avant l'ajout. */
  name: string;
  /** Rythme réglé sur la plante ; par défaut celui de l'espèce. */
  waterEveryDays?: number;
  visible: boolean;
  onClose: () => void;
};

/** Guide d'entretien complet dans une feuille du bas : une ligne courte par sujet. */
export function CareGuideSheet({ speciesId, name, waterEveryDays, visible, onClose }: SheetProps) {
  const colors = useColors();
  const styles = useStyles();
  const { height } = useWindowDimensions();
  const species = SPECIES_BY_ID[speciesId];
  if (!species) return null;
  const info = FORM_INFO[species.form];
  const climate = climateOf(speciesId);
  const guide = careGuideOf(speciesId);
  const icon = colors.forest2;

  const rows: { key: string; label: string; text: string; icon: ReactElement }[] = [
    {
      key: 'water',
      label: t('care.water'),
      text: species.hardy
        ? t('care.waterGround')
        : t('care.waterText', { n: waterEveryDays ?? waterEveryDaysOf(species) }),
      icon: <IconDrop size={18} color={icon} />,
    },
    {
      key: 'light',
      label: t('care.light'),
      text: t((species.hardy ? LIGHT_TEXT_GROUND : LIGHT_TEXT)[info.light]),
      icon: <IconSun size={18} color={icon} />,
    },
    {
      key: 'climate',
      label: t('care.climate'),
      text: t('care.climateText', {
        hmin: climate.humidity[0],
        hmax: climate.humidity[1],
        tmin: degrees(climate.ideal[0]),
        tmax: degrees(climate.ideal[1]),
        low: degrees(climate.min),
      }),
      icon: <IconAir size={18} color={icon} />,
    },
    {
      key: 'soil',
      label: t('care.soil'),
      text: t(`care.${guide.soil}`),
      icon: <IconLayers size={18} color={icon} />,
    },
    {
      key: 'pot',
      label: t('care.pot'),
      text: t(`care.${guide.pot}`),
      icon: <IconPot size={18} color={icon} />,
    },
    {
      key: 'feed',
      label: t('care.feed'),
      text: t(`care.${guide.feed}`),
      icon: <IconSprout size={18} color={icon} />,
    },
    {
      key: 'repot',
      label: t('care.repot'),
      text: t(`care.${guide.repot}`),
      icon: <IconRepot size={18} color={icon} />,
    },
  ];
  // Mauvaise herbe : comment la contenir, en premier.
  if (species.weed) {
    rows.unshift({
      key: 'weed',
      label: t('care.weed'),
      text: t(species.weed === 'roots' ? 'care.weedRoots' : 'care.weedPull'),
      icon: <IconSprout size={18} color={icon} />,
    });
  }

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Text style={styles.title} accessibilityRole="header">
        {t('care.guideTitle', { name })}
      </Text>
      <Text style={styles.latin}>{species.latin}</Text>
      <ScrollView style={{ maxHeight: height * SHEET_MAX }} contentContainerStyle={styles.rows}>
        {rows.map((row) => (
          <View
            key={row.key}
            style={styles.row}
            accessible
            accessibilityLabel={`${row.label} : ${row.text}`}
          >
            <View style={styles.rowIcon}>{row.icon}</View>
            <View style={styles.rowTexts}>
              <Text style={styles.rowLabel}>{row.label}</Text>
              <Text style={styles.rowText}>{row.text}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </BottomSheet>
  );
}

const ICON_BOX = 36;

const useStyles = makeStyles((colors) => ({
  summary: { gap: space.xxs },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: space.s },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    height: 32,
    paddingHorizontal: space.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.well,
  },
  pillText: { ...type.caption, fontFamily: type.label.fontFamily, color: colors.ink },
  link: { alignSelf: 'flex-start' },
  title: { ...type.subTitle, color: colors.forest },
  latin: { ...type.caption, fontStyle: 'italic', color: colors.inkMuted, marginBottom: space.m },
  rows: { gap: space.ml, paddingBottom: space.s },
  row: { flexDirection: 'row', gap: space.m, alignItems: 'flex-start' },
  rowIcon: {
    width: ICON_BOX,
    height: ICON_BOX,
    borderRadius: ICON_BOX / 2,
    backgroundColor: colors.well,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTexts: { flex: 1, gap: 2 },
  rowLabel: { ...type.label, color: colors.ink },
  rowText: { ...type.small, color: colors.inkSoft },
}));
