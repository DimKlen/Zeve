import fr from './fr.json';

type Dict = { readonly [key: string]: string | readonly string[] | Dict };
type Params = Record<string, string | number>;

const dict: Dict = fr;

function lookup(key: string): string | readonly string[] | Dict | undefined {
  let node: string | readonly string[] | Dict | undefined = dict;
  for (const part of key.split('.')) {
    if (node === undefined || typeof node === 'string' || Array.isArray(node)) return undefined;
    node = (node as Dict)[part];
  }
  return node;
}

/** Texte de l'interface : `t('garden.hello', { name: 'Camille' })` → « Bonjour Camille ». */
export function t(key: string, params?: Params): string {
  const value = lookup(key);
  if (typeof value !== 'string') return key;
  if (!params) return value;
  return value.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}

/** Liste de textes (ex. suggestions du chat). */
export function tList(key: string): readonly string[] {
  const value = lookup(key);
  return Array.isArray(value) ? value : [];
}
