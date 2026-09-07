const STOP_WORDS = new Set([
  'am',
  'and',
  'app',
  'central',
  'com',
  'database',
  'db',
  'dev',
  'development',
  'east',
  'ecosystem',
  'eu',
  'inc',
  'io',
  'llc',
  'north',
  'prod',
  'production',
  'qstash',
  'redis',
  'search',
  'south',
  'staging',
  'test',
  'the',
  'us',
  'vector',
  'west',
  'www',
]);

/** Base tokens for inbox project suggestions. Drops region/product noise. */
export function normalizeMappingTokens(value: string): string[] {
  return splitCamelCase(value)
    .toLowerCase()
    .replace(/['’]/g, '')
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 0 && !STOP_WORDS.has(token));
}

/** Base tokens plus adjacent joins (`white`+`shop` → `whiteshop`). */
export function mappingMatchTokens(tokens: readonly string[]): string[] {
  if (tokens.length === 0) {
    return [];
  }
  const pairs = tokens.slice(0, -1).map((token, index) => `${token}${tokens[index + 1]}`);
  return [...tokens, ...pairs];
}

export function joinedMappingTokens(tokens: readonly string[]): string {
  return tokens.join('');
}

function splitCamelCase(value: string): string {
  return value.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');
}
