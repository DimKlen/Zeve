import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { t } from '@/i18n';
import { colors, radius, space, type } from '@/theme';

import { Button } from './Button';
import { IconCamera } from './icons';
import { Rise } from './Rise';

type Props =
  | { from: 'me' | 'bot'; text: string; action?: { label: string; onPress: () => void } }
  | { from: 'photo'; uri?: string; caption?: string };

const PHOTO = { w: 190, h: 150 };

/** Bulle de chat (docs/02 §7) : moi à droite (forest), assistant à gauche (surface), photo. */
export function ChatBubble(props: Props) {
  if (props.from === 'photo') {
    return (
      <Rise style={styles.right}>
        <View
          style={[styles.photo, styles.meCorner]}
          accessible
          accessibilityRole="image"
          accessibilityLabel={props.caption ?? t('chat.photoSentA11y')}
        >
          {props.uri ? (
            <Image source={props.uri} style={StyleSheet.absoluteFill} contentFit="cover" />
          ) : (
            <>
              <IconCamera size={36} color={colors.forestText} strokeWidth={1.8} />
              {props.caption && <Text style={styles.photoCaption}>{props.caption}</Text>}
            </>
          )}
        </View>
      </Rise>
    );
  }

  if (props.from === 'me') {
    return (
      <Rise style={styles.right}>
        <View style={[styles.me, styles.meCorner]}>
          <Text style={styles.meText}>{props.text}</Text>
        </View>
      </Rise>
    );
  }

  return (
    <Rise style={styles.left}>
      <View style={styles.bot}>
        <Text style={styles.botText}>{props.text}</Text>
        {props.action && (
          <Button
            label={props.action.label}
            onPress={props.action.onPress}
            variant="secondary"
            size="s"
          />
        )}
      </View>
    </Rise>
  );
}

const styles = StyleSheet.create({
  right: { alignSelf: 'flex-end' },
  left: { alignSelf: 'flex-start' },
  meCorner: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: 6,
  },
  me: {
    maxWidth: 260,
    backgroundColor: colors.forest,
    paddingVertical: space.m,
    paddingHorizontal: space.ml,
  },
  meText: { ...type.bodyS, color: colors.bg },
  bot: {
    maxWidth: 300,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    borderBottomLeftRadius: 6,
    padding: space.ml,
    gap: space.sm,
  },
  botText: { ...type.bodyS, lineHeight: 22, color: colors.ink },
  photo: {
    width: PHOTO.w,
    height: PHOTO.h,
    overflow: 'hidden',
    backgroundColor: colors.sageDeep,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.sageDash,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xs,
  },
  photoCaption: { ...type.caption, color: colors.forest2 },
});
