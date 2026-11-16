import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { IconPin } from '@/components/icons';
import { PressableScale } from '@/components/PressableScale';
import { TextField } from '@/components/TextField';
import { t } from '@/i18n';
import { control, makeStyles, radius, space, type } from '@/theme';

import type { GardenPlace } from './api';
import { locateGarden } from './location';
import { countryByName, searchCities, searchCountries, type City } from './placeSearch';

export const EMPTY_PLACE: GardenPlace = {
  city: '',
  country: '',
  countryCode: null,
  latitude: null,
  longitude: null,
};

/** Attente après la dernière lettre avant de chercher les villes. */
const CITY_DEBOUNCE_MS = 300;

type Props = { value: GardenPlace; onChange: (place: GardenPlace) => void };

/**
 * Lieu d'un jardin (non maquetté) : « Utiliser ma position » remplit tout ; sinon le pays d'abord
 * (suggestions filtrées à la frappe), puis la ville (vraies villes de ce pays, avec leurs coordonnées).
 * Le texte libre reste accepté : il est géocodé à l'enregistrement.
 */
export function PlaceForm({ value, onChange }: Props) {
  const styles = useStyles();
  const [status, setStatus] = useState<'idle' | 'locating' | 'denied' | 'failed'>('idle');
  const [focus, setFocus] = useState<'country' | 'city' | null>(null);
  const [cities, setCities] = useState<City[]>([]);

  const locate = async () => {
    setStatus('locating');
    const result = await locateGarden();
    if (result.status !== 'ok') {
      setStatus(result.status);
      return;
    }
    setStatus('idle');
    // Le web ne donne pas la ville : on garde ce qui était déjà écrit.
    onChange({
      ...result.place,
      city: result.place.city || value.city,
      country: result.place.country || value.country,
    });
  };

  const typeCountry = (country: string) =>
    onChange({
      ...value,
      country,
      // Pays tapé en entier : reconnu comme s'il avait été choisi.
      countryCode: countryByName(country)?.code ?? null,
      latitude: null,
      longitude: null,
    });
  // Ville saisie à la main : les coordonnées de la position ne correspondent plus.
  const typeCity = (city: string) => onChange({ ...value, city, latitude: null, longitude: null });

  // Villes du pays choisi qui correspondent à la saisie (seulement pendant la saisie de la ville).
  const cityQuery = focus === 'city' && value.latitude === null ? value.city : '';
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      void searchCities(cityQuery, value.countryCode, controller.signal).then((found) => {
        if (!controller.signal.aborted) setCities(found);
      });
    }, CITY_DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [cityQuery, value.countryCode]);

  const countries = focus === 'country' && !value.countryCode ? searchCountries(value.country) : [];
  const cityChoices = cityQuery.trim().length >= 2 ? cities : [];

  const message =
    status === 'locating'
      ? t('gardens.locating')
      : status === 'denied'
        ? t('gardens.locationDenied')
        : status === 'failed'
          ? t('gardens.locationFailed')
          : null;

  return (
    <View style={styles.form}>
      <Button
        label={t('gardens.useLocation')}
        variant="secondary"
        size="s"
        loading={status === 'locating'}
        icon={(c) => <IconPin size={18} color={c} />}
        onPress={() => void locate()}
      />
      {message && (
        <Text style={styles.message} accessibilityLiveRegion="polite">
          {message}
        </Text>
      )}
      <View style={styles.field}>
        <TextField
          label={t('gardens.countryLabel')}
          testID="garden-country"
          value={value.country}
          onChangeText={typeCountry}
          onFocus={() => setFocus('country')}
          placeholder={t('gardens.countryPlaceholder')}
          maxLength={40}
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="next"
        />
        <Suggestions
          items={countries.map((c) => ({ key: c.code, title: c.name, subtitle: null }))}
          onPick={(code) => {
            const country = countries.find((c) => c.code === code)!;
            onChange({
              ...value,
              country: country.name,
              countryCode: country.code,
              latitude: null,
              longitude: null,
            });
          }}
        />
      </View>
      <View style={styles.field}>
        <TextField
          label={t('gardens.cityLabel')}
          testID="garden-city"
          value={value.city}
          onChangeText={typeCity}
          onFocus={() => setFocus('city')}
          placeholder={t('gardens.cityPlaceholder')}
          maxLength={40}
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="done"
        />
        <Suggestions
          items={cityChoices.map((c, i) => ({
            key: String(i),
            title: c.name,
            subtitle: c.region,
          }))}
          onPick={(key) => {
            const city = cityChoices[Number(key)]!;
            onChange({
              ...value,
              city: city.name,
              countryCode: value.countryCode ?? city.countryCode,
              latitude: city.latitude,
              longitude: city.longitude,
            });
            setCities([]);
          }}
        />
      </View>
    </View>
  );
}

type Item = { key: string; title: string; subtitle: string | null };

/** Propositions sous un champ : une ligne de 44 px par choix. */
function Suggestions({ items, onPick }: { items: Item[]; onPick: (key: string) => void }) {
  const styles = useStyles();
  if (!items.length) return null;
  return (
    <View style={styles.list} accessibilityRole="list">
      {items.map((item) => (
        <PressableScale
          key={item.key}
          onPress={() => onPick(item.key)}
          accessibilityRole="button"
          accessibilityLabel={item.subtitle ? `${item.title}, ${item.subtitle}` : item.title}
          style={styles.item}
        >
          <Text style={styles.itemTitle} numberOfLines={1}>
            {item.title}
          </Text>
          {item.subtitle && (
            <Text style={styles.itemSubtitle} numberOfLines={1}>
              {item.subtitle}
            </Text>
          )}
        </PressableScale>
      ))}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  form: { gap: space.m },
  field: { gap: space.xs },
  message: { ...type.caption, color: colors.inkMuted },
  list: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.inputBorder,
    overflow: 'hidden',
  },
  item: {
    minHeight: control.roundIcon,
    paddingHorizontal: space.ml + 2,
    paddingVertical: space.s,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: space.s,
  },
  itemTitle: { ...type.body, color: colors.ink, flexShrink: 1 },
  itemSubtitle: { ...type.caption, color: colors.inkMuted, flexShrink: 1 },
}));
