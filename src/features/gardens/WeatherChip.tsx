import { Text, View } from 'react-native';

import { IconThermometer } from '@/components/icons';
import { t } from '@/i18n';
import type { WeatherNow } from '@/plants/weatherAdvice';
import { makeStyles, radius, space, type, useColors } from '@/theme';

/** Degrés arrondis, avec un vrai signe moins (« −2 »). */
export const degrees = (n: number) => {
  const r = Math.round(n);
  return r < 0 ? `−${-r}` : String(r);
};

/** Puce météo du jardin (non maquettée) : « 4 °C · 82 % », à côté du lieu. */
export function WeatherChip({ weather, place }: { weather: WeatherNow; place: string }) {
  const colors = useColors();
  const styles = useStyles();
  const temp = degrees(weather.temp);
  const label =
    weather.humidity === null
      ? t('weather.chipNoHumidity', { temp })
      : t('weather.chip', { temp, humidity: weather.humidity });
  return (
    <View
      style={styles.chip}
      accessible
      accessibilityLabel={t('weather.chipA11y', { place, temp, humidity: weather.humidity ?? '?' })}
    >
      <IconThermometer size={14} color={colors.forest2} />
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: space.xxs,
    height: 26,
    paddingHorizontal: space.s,
    borderRadius: radius.pill,
    backgroundColor: colors.well,
  },
  text: { ...type.micro, fontFamily: type.label.fontFamily, color: colors.ink },
}));
