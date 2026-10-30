import { Alert, Platform } from 'react-native';

import { t } from '@/i18n';

type Options = { title: string; message?: string; confirmLabel: string; destructive?: boolean };

/**
 * Confirmation destructive : alerte native (règles « Non maquetté », docs/04).
 * Le web n'a pas d'Alert React Native : window.confirm.
 */
export function confirm({
  title,
  message,
  confirmLabel,
  destructive = true,
}: Options): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(window.confirm(message ? `${title}\n\n${message}` : title));
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: t('common.cancel'), style: 'cancel', onPress: () => resolve(false) },
      {
        text: confirmLabel,
        style: destructive ? 'destructive' : 'default',
        onPress: () => resolve(true),
      },
    ]);
  });
}
