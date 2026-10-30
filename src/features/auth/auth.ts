// Authentification Supabase (docs/06 F1) : Google (OAuth PKCE), Apple (natif iOS, OAuth ailleurs),
// e-mail par lien magique. Les écrans n'appellent que ces fonctions.
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import { cancelAllReminders } from '@/features/notifications/schedule';
import { queryClient } from '@/lib/queryClient';
import { supabase } from '@/lib/supabase';

import { claimCode, useAuthStore, type PendingSignIn } from './authStore';
import { saveFirstName } from './profile';
import { firstNameFrom, parseAuthCallback } from './rules';

/** `zeve://auth/callback` en development build ; URL locale sur le web, `exp://…` dans Expo Go. */
export const authRedirectUrl = () => Linking.createURL('auth/callback');

/** Abonne le store à la session Supabase (appelé une fois au démarrage). */
export function initAuth(): () => void {
  void supabase.auth.getSession().then(({ data }) => {
    useAuthStore.getState().setSession(data.session);
  });
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    useAuthStore.getState().setSession(session);
  });
  return () => data.subscription.unsubscribe();
}

export type StartResult = { status: 'cancelled' } | { status: 'started'; pending: PendingSignIn };

export class AuthCallbackError extends Error {}

/** Termine une connexion à partir du lien de retour (code PKCE ou jetons). */
export async function finishFromUrl(url: string): Promise<void> {
  const parsed = parseAuthCallback(url);
  if (parsed.error) throw new AuthCallbackError(parsed.errorDescription ?? parsed.error);
  if (parsed.code) {
    const { error } = await supabase.auth.exchangeCodeForSession(parsed.code);
    if (error) throw error;
    return;
  }
  if (parsed.accessToken && parsed.refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: parsed.accessToken,
      refresh_token: parsed.refreshToken,
    });
    if (error) throw error;
    return;
  }
  throw new AuthCallbackError('Lien de connexion incomplet.');
}

/** OAuth dans le navigateur système (Google partout, Apple hors iOS). */
async function startOAuth(provider: 'google' | 'apple'): Promise<StartResult> {
  const redirectTo = authRedirectUrl();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      skipBrowserRedirect: true,
      scopes: provider === 'google' ? 'openid email profile' : 'name email',
    },
  });
  if (error) throw error;
  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success') return { status: 'cancelled' };
  const parsed = parseAuthCallback(result.url);
  if (parsed.error === 'access_denied') return { status: 'cancelled' };
  if (parsed.code && !claimCode(parsed.code)) {
    // Déjà pris en charge par le lien profond (app/auth/callback.tsx).
    return { status: 'cancelled' };
  }
  return { status: 'started', pending: { provider, finish: () => finishFromUrl(result.url) } };
}

export const signInWithGoogle = () => startOAuth('google');

/** Apple : feuille native sur iOS (nonce SHA-256), OAuth web ailleurs (décision produit docs/04 §2). */
export async function signInWithApple(): Promise<StartResult> {
  if (Platform.OS !== 'ios') return startOAuth('apple');
  const rawNonce = Crypto.randomUUID();
  const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);
  let credential: AppleAuthentication.AppleAuthenticationCredential;
  try {
    credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });
  } catch (e) {
    if ((e as { code?: string }).code === 'ERR_REQUEST_CANCELED') return { status: 'cancelled' };
    throw e;
  }
  const token = credential.identityToken;
  if (!token) throw new AuthCallbackError('Apple n’a pas renvoyé de jeton.');
  // Apple ne donne le nom qu'au tout premier login : on l'enregistre tout de suite.
  const firstName = firstNameFrom(credential.fullName);
  return {
    status: 'started',
    pending: {
      provider: 'apple',
      finish: async () => {
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'apple',
          token,
          nonce: rawNonce,
        });
        if (error) throw error;
        if (firstName && data.user) await saveFirstName(data.user.id, firstName);
      },
    },
  };
}

/** Envoie le lien magique ; l'ouverture du lien mène à app/auth/callback.tsx. */
export async function sendMagicLink(email: string): Promise<void> {
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim(),
    options: { emailRedirectTo: authRedirectUrl() },
  });
  if (error) throw error;
}

/** Déconnexion : session, cache des requêtes et notifications planifiées (docs/06 F1). */
export async function signOut(): Promise<void> {
  await cancelAllReminders();
  await supabase.auth.signOut();
  queryClient.clear();
}

/** Erreur réseau (fetch impossible) : toast « Pas de connexion internet ». */
export function isNetworkError(e: unknown): boolean {
  const message = e instanceof Error ? e.message : String(e);
  return /network request failed|failed to fetch|fetch failed|networkerror/i.test(message);
}
