import { Text, View } from 'react-native';

import { t } from '@/i18n';
import { control, makeStyles, space, type, useColors } from '@/theme';

import { LogoApple, LogoGoogle } from './icons';
import { PressableScale } from './PressableScale';

type Props = {
  provider: 'google' | 'apple';
  onPress?: () => void;
  disabled?: boolean;
};

/**
 * Boutons de connexion Google / Apple (docs/02 §6) : h 56, r 28, logos officiels.
 * Google blanc + contour strongBorder ; Apple noir, texte blanc.
 */
export function ProviderButton({ provider, onPress, disabled = false }: Props) {
  const colors = useColors();
  const styles = useStyles();
  const google = provider === 'google';
  const label = t(google ? 'login.google' : 'login.apple');
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={[styles.base, google ? styles.google : styles.apple]}
    >
      <View style={styles.logo}>
        {google ? <LogoGoogle /> : <LogoApple color={colors.white} />}
      </View>
      <Text style={[styles.label, { color: google ? colors.onLight : colors.white }]}>{label}</Text>
    </PressableScale>
  );
}

const useStyles = makeStyles((colors) => ({
  base: {
    height: control.providerButton,
    borderRadius: control.providerButton / 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.m,
  },
  google: { backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.strongBorder },
  apple: { backgroundColor: colors.apple },
  logo: { width: 26, height: 26, alignItems: 'center', justifyContent: 'center' },
  label: { ...type.cardTitle },
}));
