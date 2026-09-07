const OLD_NEON_DATABASE_URL_KEY = 'OLD_NEON_PROJECT_DATABASE_URL';

export type PostgresIdentity = {
  host: string;
  database: string;
};

export type MigrationTargets = {
  oldUrl: string;
  costopsUrl: string;
};

/**
 * Reads only `OLD_NEON_PROJECT_DATABASE_URL`. Does not invent a URL and does not
 * consult similarly named typo keys.
 */
export function readOldNeonDatabaseUrl(env: NodeJS.Dict<string>): string {
  const value = env[OLD_NEON_DATABASE_URL_KEY];
  const trimmed = typeof value === 'string' ? value.trim() : '';
  if (!trimmed) {
    throw new Error(
      'OLD_NEON_PROJECT_DATABASE_URL is not set. This script reads only that variable and will not invent a connection string.',
    );
  }
  return trimmed;
}

export function postgresIdentity(connectionString: string): PostgresIdentity {
  const parsed = new URL(connectionString);
  if (parsed.protocol !== 'postgres:' && parsed.protocol !== 'postgresql:') {
    throw new Error('Not a PostgreSQL URL');
  }
  const fromPath = decodeURIComponent(parsed.pathname.replace(/^\//, '')).split('/')[0] ?? '';
  const fromQuery = parsed.searchParams.get('dbname') ?? '';
  return {
    host: parsed.hostname.toLowerCase(),
    database: (fromPath || fromQuery).toLowerCase(),
  };
}

export function urlsPointAtSameDatabase(left: string, right: string): boolean {
  const oldId = postgresIdentity(left);
  const newId = postgresIdentity(right);
  return (
    oldId.host.length > 0 &&
    oldId.database.length > 0 &&
    oldId.host === newId.host &&
    oldId.database === newId.database
  );
}

export function assertDistinctMigrationTargets(oldUrl: string, costopsUrl: string): void {
  let oldId: PostgresIdentity;
  let newId: PostgresIdentity;
  try {
    oldId = postgresIdentity(oldUrl);
    newId = postgresIdentity(costopsUrl);
  } catch {
    throw new Error(
      'Could not parse OLD_NEON_PROJECT_DATABASE_URL or DATABASE_URL as a PostgreSQL URL.',
    );
  }
  if (!oldId.host || !oldId.database || !newId.host || !newId.database) {
    throw new Error(
      'OLD_NEON_PROJECT_DATABASE_URL and DATABASE_URL must include a host and database name.',
    );
  }
  if (oldId.host === newId.host && oldId.database === newId.database) {
    throw new Error(
      'OLD_NEON_PROJECT_DATABASE_URL and DATABASE_URL look like the same database (host + database name). Aborting to protect the old Neon app.',
    );
  }
}

/**
 * Resolves the read-only old Neon URL and the CostOps write URL, then aborts
 * when they identify the same host + database.
 */
export function assertMigrationEnv(env: NodeJS.Dict<string>): MigrationTargets {
  const oldUrl = readOldNeonDatabaseUrl(env);
  const costopsUrl = typeof env.DATABASE_URL === 'string' ? env.DATABASE_URL.trim() : '';
  if (!costopsUrl) {
    throw new Error('DATABASE_URL is not set. CostOps writes use this URL only.');
  }
  assertDistinctMigrationTargets(oldUrl, costopsUrl);
  return { oldUrl, costopsUrl };
}
