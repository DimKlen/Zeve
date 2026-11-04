import type { ReactElement } from 'react';
import { Text, View } from 'react-native';

import {
  IconAir,
  IconDrop,
  IconHome,
  IconSprout,
  IconSun,
  IconThermometer,
} from '@/components/icons';
import { t } from '@/i18n';
import { climateOf, seasonalAdvice, seasonOf } from '@/plants/seasons';
import { weatherAdvice, type AdviceTopic, type WeatherNow } from '@/plants/weatherAdvice';
import { makeStyles, radius, space, type, useColors } from '@/theme';

type Props = {
  speciesId: string;
  /** Jardin dans l'hémisphère sud : saisons inversées. */
  southern?: boolean;
  /** Météo réelle du jardin : ligne « Aujourd'hui à … » et conseils du jour. */
  weather?: { now: WeatherNow | null; forecastMin: number | null; place: string | null } | null;
  now?: Date;
};

/** Degrés avec un vrai signe moins (« −10 »). */
const degrees = (n: number) => (n < 0 ? `−${-n}` : String(n));

/**
 * Carte « Saison » de la fiche (non maquettée, même style que « Bon à savoir ») : saison en cours,
 * humidité et température idéales, puis les conseils de la saison pour cette espèce.
 */
export function SeasonCard({ speciesId, southern = false, weather, now = new Date() }: Props) {
  const colors = useColors();
  const styles = useStyles();
  const season = seasonOf(now, southern);
  const climate = climateOf(speciesId);
  const advice = seasonalAdvice(speciesId, season);
  // Conseils d'après la météo réelle : ils remplacent le conseil de saison du même sujet.
  const today = weatherAdvice(climate, weather?.now ?? null, weather?.forecastMin ?? null, season);
  const todayFor = (topic: AdviceTopic) => today.find((a) => a.replaces === topic);
  const icon = colors.forest2;

  const rows: { key: string; label: string; text: string; icon: ReactElement }[] = [
    {
      key: 'water',
      label: t('season.water'),
      text: t(`season.${advice.water}`),
      icon: <IconDrop size={18} color={icon} />,
    },
    {
      key: 'light',
      label: t('season.light'),
      text: t(`season.${advice.light}`),
      icon: <IconSun size={18} color={icon} />,
    },
    {
      key: 'place',
      label: t('season.place'),
      text: t(`season.${advice.place}`),
      icon: <IconHome size={18} color={icon} />,
    },
    {
      key: 'feed',
      label: t('season.feed'),
      text: t(`season.${advice.feed}`),
      icon: <IconSprout size={18} color={icon} />,
    },
  ];
  if (advice.humidity || todayFor('humidity')) {
    rows.push({
      key: 'air',
      label: t('season.air'),
      text: advice.humidity ? t(`season.${advice.humidity}`) : '',
      icon: <IconAir size={18} color={icon} />,
    });
  }
  const TOPIC: Record<string, AdviceTopic> = {
    water: 'water',
    light: 'light',
    place: 'place',
    air: 'humidity',
  };
  for (const row of rows) {
    const replaced = TOPIC[row.key] && todayFor(TOPIC[row.key]!);
    if (replaced) {
      row.label = `${row.label} · ${t('weather.label')}`;
      row.text = t(`weather.${replaced.key}`);
    }
  }
  const nowWeather = weather?.now;
  const todayLine =
    nowWeather && weather?.place
      ? nowWeather.humidity === null
        ? t('weather.todayNoHumidity', {
            place: weather.place,
            temp: degrees(Math.round(nowWeather.temp)),
          })
        : t('weather.today', {
            place: weather.place,
            temp: degrees(Math.round(nowWeather.temp)),
            humidity: nowWeather.humidity,
          })
      : null;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.overline}>{t('season.title')}</Text>
        <Text style={styles.now}>
          {t('season.now', { season: t(`season.nowNames.${season}`) })}
        </Text>
      </View>
      {todayLine && <Text style={styles.today}>{todayLine}</Text>}

      <View style={styles.stats}>
        <View
          style={styles.stat}
          accessible
          accessibilityLabel={t('season.humidityA11y', {
            min: climate.humidity[0],
            max: climate.humidity[1],
          })}
        >
          <IconAir size={18} color={icon} />
          <View style={styles.statTexts}>
            <Text style={styles.statLabel}>{t('season.humidity')}</Text>
            <Text style={styles.statValue}>
              {t('season.humidityValue', { min: climate.humidity[0], max: climate.humidity[1] })}
            </Text>
          </View>
        </View>
        <View
          style={styles.stat}
          accessible
          accessibilityLabel={t('season.temperatureA11y', {
            min: degrees(climate.ideal[0]),
            max: degrees(climate.ideal[1]),
            low: degrees(climate.min),
          })}
        >
          <IconThermometer size={18} color={icon} />
          <View style={styles.statTexts}>
            <Text style={styles.statLabel}>{t('season.temperature')}</Text>
            <Text style={styles.statValue}>
              {t('season.temperatureValue', {
                min: degrees(climate.ideal[0]),
                max: degrees(climate.ideal[1]),
              })}
            </Text>
            <Text style={styles.statHint}>
              {t('season.temperatureMin', { min: degrees(climate.min) })}
            </Text>
          </View>
        </View>
      </View>

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
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: space.ml,
    paddingHorizontal: space.ml + 2,
    gap: space.m,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  overline: { ...type.overline, color: colors.inkMuted },
  today: { ...type.small, fontFamily: type.label.fontFamily, color: colors.forest },
  now: { ...type.caption, color: colors.inkMuted, flexShrink: 1, textAlign: 'right' },
  stats: { flexDirection: 'row', gap: space.sm },
  stat: {
    flex: 1,
    flexDirection: 'row',
    gap: space.s,
    backgroundColor: colors.well,
    borderRadius: radius.sm,
    padding: space.sm,
  },
  statTexts: { flex: 1, gap: 2 },
  statLabel: { ...type.micro, color: colors.inkMuted },
  statValue: { ...type.cardTitle, color: colors.ink },
  statHint: { ...type.micro, color: colors.inkMuted },
  row: { flexDirection: 'row', gap: space.sm, alignItems: 'flex-start' },
  rowIcon: { paddingTop: 2 },
  rowTexts: { flex: 1, gap: 1 },
  rowLabel: { ...type.label, color: colors.ink },
  rowText: { ...type.small, color: colors.inkSoft },
}));
