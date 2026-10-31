import * as WebBrowser from 'expo-web-browser';
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { Keyboard, KeyboardAvoidingView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconSend } from '@/components/icons';
import { IconButton } from '@/components/IconButton';
import { ProviderButton } from '@/components/ProviderButton';
import { Rise } from '@/components/Rise';
import { Screen } from '@/components/Screen';
import { TextButton } from '@/components/TextButton';
import { TextField } from '@/components/TextField';
import { showToast } from '@/components/Toast';
import {
  isNetworkError,
  sendMagicLink,
  signInWithApple,
  signInWithGoogle,
  type StartResult,
} from '@/features/auth/auth';
import { useAuthStore } from '@/features/auth/authStore';
import { MascotTrio } from '@/features/auth/MascotTrio';
import { isValidEmail } from '@/features/auth/rules';
import { t } from '@/i18n';
import { PRIVACY_URL, TERMS_URL } from '@/lib/config';
import { go } from '@/motion/transitions';
import { a11y, colors, control, layout, space, type } from '@/theme';

/** Connexion (docs/04 §2) : Google, Apple, e-mail par lien magique. */
export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState(false);
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);

  // Clavier ouvert (formulaire e-mail) : le champ et son bouton remontent dans la vue.
  useEffect(() => {
    const sub = Keyboard.addListener('keyboardDidShow', () =>
      scroll.current?.scrollToEnd({ animated: true }),
    );
    return () => sub.remove();
  }, []);

  const start = async (signIn: () => Promise<StartResult>) => {
    if (busy) return;
    setBusy(true);
    try {
      const result = await signIn();
      if (result.status === 'cancelled') {
        showToast(t('toast.loginCancelled'));
        return;
      }
      useAuthStore.getState().setPending(result.pending);
      go('connecting');
    } catch (e) {
      showToast(isNetworkError(e) ? t('toast.offline') : t('connecting.failed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen name="login" edges={['top']}>
      <KeyboardAvoidingView style={styles.root} behavior="padding">
        {/* Écran rétréci par le clavier : le contenu défile au lieu de se chevaucher. */}
        <ScrollView
          ref={scroll}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: Math.max(insets.bottom, space.x5) },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <MascotTrio />
            <View style={styles.titleBlock}>
              <Rise delay="d1">
                <Text
                  style={styles.title}
                  accessibilityRole="header"
                  maxFontSizeMultiplier={a11y.maxTitleScale}
                >
                  {t('login.title')}
                </Text>
              </Rise>
              <Rise delay="d2">
                <Text style={styles.subtitle}>{t('login.subtitle')}</Text>
              </Rise>
            </View>
          </View>

          <View style={styles.actions}>
            <Rise delay="d2">
              <ProviderButton
                provider="google"
                disabled={busy}
                onPress={() => start(signInWithGoogle)}
              />
            </Rise>
            <Rise delay="d3">
              <ProviderButton
                provider="apple"
                disabled={busy}
                onPress={() => start(signInWithApple)}
              />
            </Rise>
            <EmailSection />
            <Rise delay="d4">
              <Legal />
            </Rise>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

/** « Continuer avec un e-mail » remplacé par le formulaire du lien magique. */
function EmailSection() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [sending, setSending] = useState(false);

  if (!open) {
    return (
      <Rise delay="d4">
        <TextButton label={t('login.email')} underline onPress={() => setOpen(true)} />
      </Rise>
    );
  }

  const submit = async () => {
    if (sending) return;
    if (!isValidEmail(email)) {
      setError(t('login.emailInvalid'));
      return;
    }
    setError(undefined);
    setSending(true);
    try {
      await sendMagicLink(email);
      showToast(t('toast.magicSent'));
    } catch (e) {
      showToast(isNetworkError(e) ? t('toast.offline') : t('connecting.failed'));
    } finally {
      setSending(false);
    }
  };

  return (
    <Rise style={styles.form}>
      <Text style={styles.label}>{t('login.emailLabel')}</Text>
      <View style={styles.row}>
        <View style={styles.field}>
          <TextField
            variant="email"
            testID="email-input"
            value={email}
            onChangeText={(value) => {
              setEmail(value);
              if (error) setError(undefined);
            }}
            accessibilityLabel={t('login.emailLabel')}
            placeholder={t('login.emailPlaceholder')}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="send"
            onSubmitEditing={submit}
            autoFocus
            error={error}
          />
        </View>
        <IconButton
          variant="forest"
          size={control.inputTall}
          accessibilityLabel={t('login.emailSendA11y')}
          disabled={sending}
          onPress={submit}
          icon={(c) => <IconSend color={c} />}
        />
      </View>
      {!error && <Text style={styles.help}>{t('login.emailHelp')}</Text>}
    </Rise>
  );
}

/** Mentions légales avec liens vers les pages web. */
function Legal() {
  const parts = t('login.legal').split(/(\{terms\}|\{privacy\})/);
  const open = (url: string) => void WebBrowser.openBrowserAsync(url);
  return (
    <Text style={styles.legal}>
      {parts.map((part, i) => {
        if (part === '{terms}' || part === '{privacy}') {
          const terms = part === '{terms}';
          return (
            <Text
              key={i}
              style={styles.link}
              accessibilityRole="link"
              onPress={() => open(terms ? TERMS_URL : PRIVACY_URL)}
            >
              {t(terms ? 'login.terms' : 'login.privacy')}
            </Text>
          );
        }
        return part;
      })}
    </Text>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: layout.screenPadTabs },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xxl,
    paddingTop: 40,
  },
  titleBlock: { alignItems: 'center', gap: space.s },
  title: { ...type.hero, color: colors.forest, textAlign: 'center' },
  subtitle: { ...type.bodyL, color: colors.inkMuted, textAlign: 'center', maxWidth: 280 },
  actions: { gap: space.sm },
  form: { gap: space.s, marginTop: space.xxs },
  label: { ...type.label, color: colors.inkMuted },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: space.s },
  field: { flex: 1 },
  help: { ...type.caption, color: colors.inkMuted },
  legal: { ...type.micro, lineHeight: 17.4, color: colors.inkMuted, textAlign: 'center' },
  link: { color: colors.forest, textDecorationLine: 'underline' },
});
