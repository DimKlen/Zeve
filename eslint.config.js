// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierRecommended = require('eslint-plugin-prettier/recommended');

// Couleurs hex : seulement dans src/theme (CLAUDE.md, règles non négociables).
// Pas de quantificateur {n,m} : esquery lit la virgule comme un séparateur de sélecteurs.
const HEX_COLOR = '/#[0-9a-fA-F][0-9a-fA-F][0-9a-fA-F]/';
const hexMessage = 'Pas de couleur hex en dur : utilise les tokens de src/theme.';

module.exports = defineConfig([
  expoConfig,
  prettierRecommended,
  {
    ignores: [
      'dist/*',
      '.expo/*',
      'android/*',
      'ios/*',
      'expo-env.d.ts',
      'reference/*',
      'design/*',
      'supabase/*',
      'e2e/*',
    ],
  },
  {
    rules: {
      'no-restricted-syntax': [
        'error',
        { selector: `Literal[value=${HEX_COLOR}]`, message: hexMessage },
        { selector: `TemplateElement[value.raw=${HEX_COLOR}]`, message: hexMessage },
      ],
    },
  },
  {
    // Le thème définit les couleurs ; la config native ne peut pas l'importer ; icônes et dessins
    // de plantes sont copiés tels quels depuis reference/ (palettes d'espèces, couleurs par défaut).
    files: ['src/theme/**', 'src/plants/**', 'src/components/icons.tsx', 'app.config.ts'],
    rules: { 'no-restricted-syntax': 'off' },
  },
]);
