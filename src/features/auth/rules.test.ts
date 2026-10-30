import { firstNameFrom, isValidEmail, nextRoute, parseAuthCallback } from './rules';

describe('isValidEmail', () => {
  it('accepte une adresse simple, y compris un relais Apple', () => {
    expect(isValidEmail('camille@exemple.fr')).toBe(true);
    expect(isValidEmail('  Camille.Dupont+zeve@exemple.co.uk ')).toBe(true);
    expect(isValidEmail('x7k2@privaterelay.appleid.com')).toBe(true);
  });

  it('refuse une adresse incomplète', () => {
    expect(isValidEmail('')).toBe(false);
    expect(isValidEmail('camille@')).toBe(false);
    expect(isValidEmail('camille@exemple')).toBe(false);
    expect(isValidEmail('camille exemple.fr')).toBe(false);
    expect(isValidEmail('@exemple.fr')).toBe(false);
  });
});

describe('parseAuthCallback', () => {
  it('lit le code PKCE dans la query', () => {
    expect(parseAuthCallback('zeve://auth/callback?code=abc123')).toEqual({ code: 'abc123' });
  });

  it('lit les jetons du fragment (flux implicite)', () => {
    expect(
      parseAuthCallback('zeve://auth/callback#refresh_token=rt&access_token=at&type=magiclink'),
    ).toEqual({ accessToken: 'at', refreshToken: 'rt' });
  });

  it('remonte une erreur et reconnaît l’annulation', () => {
    expect(
      parseAuthCallback('zeve://auth/callback?error=access_denied&error_description=Annul%C3%A9'),
    ).toEqual({ error: 'access_denied', errorDescription: 'Annulé' });
  });

  it('ne trouve rien dans une URL vide', () => {
    expect(parseAuthCallback('zeve://auth/callback')).toEqual({});
  });
});

describe('nextRoute', () => {
  it('va à la connexion sans session', () => {
    expect(nextRoute(false, null)).toBe('login');
  });

  it('montre l’onboarding tant qu’il n’est pas fait', () => {
    expect(nextRoute(true, { onboarded_at: null })).toBe('reminders');
  });

  it('va au jardin une fois l’onboarding fait', () => {
    expect(nextRoute(true, { onboarded_at: '2026-10-30T10:00:00Z' })).toBe('garden');
  });

  it('montre l’onboarding si le profil n’existe pas encore', () => {
    expect(nextRoute(true, null)).toBe('reminders');
  });
});

describe('firstNameFrom', () => {
  it('prend le prénom donné par Apple', () => {
    expect(firstNameFrom({ givenName: ' Camille ', familyName: 'Dupont' })).toBe('Camille');
  });

  it('retombe sur le premier mot du surnom', () => {
    expect(firstNameFrom({ givenName: null, nickname: 'Cam D' })).toBe('Cam');
  });

  it('renvoie null sans nom', () => {
    expect(firstNameFrom(null)).toBeNull();
    expect(firstNameFrom({ givenName: '  ' })).toBeNull();
  });
});
