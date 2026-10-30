import type { Session } from '@supabase/supabase-js';
import { create } from 'zustand';

export type Provider = 'google' | 'apple' | 'email';

/** Connexion commencée sur Connexion (ou par le lien magique), terminée par « Connexion en cours ». */
export type PendingSignIn = {
  provider: Provider;
  finish: () => Promise<void>;
};

type AuthState = {
  session: Session | null;
  /** Session restaurée depuis le stockage (le lancement attend ce moment). */
  ready: boolean;
  pending: PendingSignIn | null;
  setSession: (session: Session | null) => void;
  setPending: (pending: PendingSignIn | null) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  ready: false,
  pending: null,
  setSession: (session) => set({ session, ready: true }),
  setPending: (pending) => set({ pending }),
}));

/** Prend la connexion en attente (une seule fois). */
export function takePendingSignIn(): PendingSignIn | null {
  const { pending } = useAuthStore.getState();
  useAuthStore.setState({ pending: null });
  return pending;
}

// Un code PKCE ne s'échange qu'une fois : sur Android, le retour OAuth peut arriver à la fois
// par WebBrowser et par le lien profond. Le premier qui le réclame le traite.
const claimed = new Set<string>();
export function claimCode(code: string): boolean {
  if (claimed.has(code)) return false;
  claimed.add(code);
  return true;
}
