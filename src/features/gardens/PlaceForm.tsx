import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { IconPin } from '@/components/icons';
import { TextField } from '@/components/TextField';
import { t } from '@/i18n';
import { makeStyles, space, type } from '@/theme';

import type { GardenPlace } from './api';
import { locateGarden } from './location';

export const EMPTY_PLACE: GardenPlace = {
  city: '',
  country: '',
  countryCode: null,
  latitude: null,
  longitude: null,
};

type Props = { value: GardenPlace; onChange: (place: GardenPlace) => void };

/**
 * Lieu d'un jardin (non maquetté) : « Utiliser ma position » remplit ville et pays ; la saisie
 * manuelle reste toujours possible (permission refusée, web, autre lieu que l'endroit actuel).
 */
export function PlaceForm({ value, onChange }: Props) {
  const styles = useStyles();
  const [status, setStatus] = useState<'idle' | 'locating' | 'denied' | 'failed'>('idle');

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

  // Saisie à la main : les coordonnées de la position ne correspondent plus.
  const edit = (patch: Partial<GardenPlace>) =>
    onChange({ ...value, ...patch, countryCode: null, latitude: null, longitude: null });

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
      <TextField
        label={t('gardens.cityLabel')}
        testID="garden-city"
        value={value.city}
        onChangeText={(city) => edit({ city })}
        placeholder={t('gardens.cityPlaceholder')}
        maxLength={40}
        autoCapitalize="words"
        returnKeyType="next"
      />
      <TextField
        label={t('gardens.countryLabel')}
        testID="garden-country"
        value={value.country}
        onChangeText={(country) => edit({ country })}
        placeholder={t('gardens.countryPlaceholder')}
        maxLength={40}
        autoCapitalize="words"
        returnKeyType="done"
      />
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  form: { gap: space.m },
  message: { ...type.caption, color: colors.inkMuted },
}));
