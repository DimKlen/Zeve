// Règles pures de l'authentification (docs/06 F1–F2), testées sans Supabase.

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Adresse e-mail plausible (le vrai contrôle est l'envoi du lien magique). */
export function isValidEmail(value: string): boolean {
  return EMAIL.test(value.trim());
}

export type AuthCallback = {
  code?: string;
  accessToken?: string;
  refreshToken?: string;
  error?: string;
  errorDescription?: string;
};

/**
 * Lit le lien de retour `zeve://auth/callback` : code PKCE (query), jetons (fragment, flux implicite)
 * ou erreur (`error=access_denied` quand l'utilisateur annule chez le fournisseur).
 */
export function parseAuthCallback(url: string): AuthCallback {
  const params = new Map<string, string>();
  const [beforeHash = '', hash = ''] = url.split('#');
  const query = beforeHash.includes('?') ? beforeHash.slice(beforeHash.indexOf('?') + 1) : '';
  for (const part of [query, hash]) {
    for (const pair of part.split('&')) {
      if (!pair) continue;
      const [key = '', value = ''] = pair.split('=');
      params.set(decodeURIComponent(key), decodeURIComponent(value.replace(/\+/g, ' ')));
    }
  }

  const out: AuthCallback = {};
  const error = params.get('error');
  if (error) {
    out.error = error;
    const description = params.get('error_description');
    if (description) out.errorDescription = description;
    return out;
  }
  const code = params.get('code');
  if (code) out.code = code;
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  if (accessToken && refreshToken) {
    out.accessToken = accessToken;
    out.refreshToken = refreshToken;
  }
  return out;
}

export type AfterAuthRoute = 'login' | 'reminders' | 'garden';

/** Aiguillage après le lancement ou la connexion (docs/04 §1, §5). */
export function nextRoute(
  hasSession: boolean,
  profile: { onboarded_at: string | null } | null,
): AfterAuthRoute {
  if (!hasSession) return 'login';
  if (!profile || !profile.onboarded_at) return 'reminders';
  return 'garden';
}

type NameParts = {
  givenName?: string | null;
  nickname?: string | null;
  familyName?: string | null;
};

/** Prénom à enregistrer dans `profiles.first_name` (Apple ne le donne qu'au 1er login). */
export function firstNameFrom(name: NameParts | null | undefined): string | null {
  if (!name) return null;
  const given = name.givenName?.trim();
  if (given) return given;
  const nick = name.nickname?.trim().split(/\s+/)[0];
  return nick || null;
}
