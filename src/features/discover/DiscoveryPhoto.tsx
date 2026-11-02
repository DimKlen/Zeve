import { Image } from 'expo-image';
import { useState } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { IconLeafSearch } from '@/components/icons';
import { makeStyles, useColors } from '@/theme';

type Props = {
  uri: string;
  /** Taille de l'icône de repli (photo absente ou effacée du cache de l'appareil). */
  iconSize: number;
  style: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

/**
 * Photo d'une découverte, gardée seulement sur l'appareil : si elle n'existe plus (cache vidé),
 * on montre le puits et l'icône Découvrir plutôt qu'une image cassée.
 */
export function DiscoveryPhoto({ uri, iconSize, style, accessibilityLabel }: Props) {
  const colors = useColors();
  const styles = useStyles();
  const [failed, setFailed] = useState(false);
  const show = !!uri && !failed;
  return (
    <View style={[styles.well, style]}>
      {show ? (
        <Image
          source={{ uri }}
          style={styles.image}
          contentFit="cover"
          accessibilityLabel={accessibilityLabel}
          onError={() => setFailed(true)}
        />
      ) : (
        <IconLeafSearch size={iconSize} color={colors.inkMuted} />
      )}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  well: {
    backgroundColor: colors.well,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: { width: '100%', height: '100%' },
}));
