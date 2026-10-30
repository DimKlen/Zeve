import { useId, type ComponentRef, type Ref } from 'react';
import { Platform, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { colors, control, fonts, radius, space, type } from '@/theme';

import { IconSearch } from './icons';

type Variant = 'default' | 'email' | 'search' | 'chat';

type Props = Omit<TextInputProps, 'style' | 'ref'> & {
  ref?: Ref<ComponentRef<typeof TextInput>>;
  /** Libellé au-dessus du champ (600 13 muted). Sans libellé visible, `accessibilityLabel` est requis. */
  label?: string;
  /** default : h 50 r 16 · email : h 52 pilule · search : h 48 pilule + loupe · chat : h 48 pilule. */
  variant?: Variant;
  error?: string;
};

const HEIGHT: Record<Variant, number> = {
  default: control.input,
  email: control.inputTall,
  search: control.chatInput,
  chat: control.chatInput,
};

/** Champ texte (docs/02 §7). */
export function TextField({
  ref,
  label,
  variant = 'default',
  error,
  accessibilityLabel,
  ...input
}: Props) {
  const id = useId();
  const height = HEIGHT[variant];
  const pill = variant !== 'default';
  return (
    <View style={styles.wrap}>
      {label && (
        <Text nativeID={id} style={styles.label}>
          {label}
        </Text>
      )}
      <View>
        {variant === 'search' && (
          <View style={styles.searchIcon} pointerEvents="none">
            <IconSearch color={colors.inkMuted} />
          </View>
        )}
        <TextInput
          ref={ref}
          accessibilityLabel={accessibilityLabel ?? label}
          aria-labelledby={label ? id : undefined}
          placeholderTextColor={colors.inkMuted}
          selectionColor={colors.forest2}
          style={[
            styles.input,
            { height, borderRadius: pill ? height / 2 : radius.md },
            variant === 'email' && styles.email,
            variant === 'chat' && styles.small,
            variant === 'search' && styles.search,
            !!error && styles.inputError,
          ]}
          {...input}
        />
      </View>
      {error && (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.s },
  label: { ...type.label, color: colors.inkMuted },
  input: {
    borderWidth: 1.5,
    borderColor: colors.inputBorder,
    backgroundColor: colors.surface,
    paddingHorizontal: space.ml + 2,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.ink,
    // Web : pas de contour de focus du navigateur par-dessus la bordure du champ.
    ...Platform.select({ web: { outlineWidth: 0 }, default: {} }),
  },
  email: { borderColor: colors.strongBorder, paddingHorizontal: space.l },
  small: { fontSize: 15 },
  search: { fontSize: 15, paddingLeft: 44 },
  searchIcon: {
    position: 'absolute',
    left: space.ml + 2,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    zIndex: 1,
  },
  inputError: { borderColor: colors.danger },
  error: { ...type.caption, color: colors.danger },
});
