import { Text, View } from 'react-native';

import { IconAir, IconThermometer } from '@/components/icons';
import { t } from '@/i18n';
import { climateOf, seasonalAdvice, seasonOf, type Season } from '@/plants/seasons';
import { weatherAdvice, type AdviceTopic, type WeatherNow } from '@/plants/weatherAdvice';
import { makeStyles, radius, space, type, useColors } from '@/theme';

/** Météo réelle du jardin : ligne « Aujourd'hui à … » et conseils du jour. */
export type GardenWeather = {
  now: WeatherNow | null;
  forecastMin: number | null;
  place: string | null;
} | null;

type Props = {
  speciesId: string;
  /** Jardin dans l'hémisphère sud : saisons inversées. */
  southern?: boolean;
  weather?: GardenWeather;
  now?: Date;
};

/** Degrés avec un vrai signe moins (« −10 »). */
const degrees = (n: number) => (n < 0 ? `−${-n}` : String(n));

export type SeasonRowIcon = 'water' | 'light' | 'place' | 'feed' | 'air';
export type SeasonRow = { key: SeasonRowIcon; label: string; text: string };

/**
 * Conseils de la saison pour cette espèce (arrosage, lumière, emplacement, engrais, air), remplacés
 * par ceux de la météo réelle quand elle s'en mêle. Affichés dans le guide d'entretien.
 */
export function seasonRowsOf(
  speciesId: string,
  southern: boolean,
  weather: GardenWeather | undefined,
  now: Date = new Date(),
): { season: Season; rows: SeasonRow[] } {
  const season = seasonOf(now, southern);
  const climate = climateOf(speciesId);
  const advice = seasonalAdvice(speciesId, season);
  const today = weatherAdvice(climate, weather?.now ?? null, weather?.forecastMin ?? null, season);
  const todayFor = (topic: AdviceTopic) => today.find((a) => a.replaces === topic);

  const rows: SeasonRow[] = [
    { key: 'water', label: t('season.water'), text: t(`season.${advice.water}`) },
    { key: 'light', label: t('season.light'), text: t(`season.${advice.light}`) },
    { key: 'place', label: t('season.place'), text: t(`season.${advice.place}`) },
    { key: 'feed', label: t('season.feed'), text: t(`season.${advice.feed}`) },
  ];
  if (advice.humidity || todayFor('humidity')) {
    rows.push({
      key: 'air',
      label: t('season.air'),
      text: advice.humidity ? t(`season.${advice.humidity}`) : '',
    });
  }
  const TOPIC: Partial<Record<SeasonRowIcon, AdviceTopic>> = {
    water: 'water',
    light: 'light',
    place: 'place',
    air: 'humidity',
  };
  for (const row of rows) {
    const topic = TOPIC[row.key];
    const replaced = topic && todayFor(topic);
    if (replaced) {
      row.label = `${row.label} · ${t('weather.label')}`;
      row.text = t(`weather.${replaced.key}`);
    }
  }
  return { season, rows };
}

/**
 * Carte « Saison » de la fiche (non maquettée, même style que « Bon à savoir ») : saison en cours,
 * météo du jour, humidité et température idéales. Les conseils détaillés sont dans le guide d'entretien.
 */
export function SeasonCard({ speciesId, southern = false, weather, now = new Date() }: Props) {
  const colors = useColors();
  const styles = useStyles();
  const season = seasonOf(now, southern);
  const climate = climateOf(speciesId);
  const icon = colors.forest2;
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
}));
