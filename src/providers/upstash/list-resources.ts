import {
  UPSTASH_QSTASH_RESOURCE_TYPE,
  UPSTASH_REDIS_RESOURCE_TYPE,
  UPSTASH_SEARCH_RESOURCE_TYPE,
  UPSTASH_VECTOR_RESOURCE_TYPE,
} from '@/config/constants';
import { upstashGetJson } from '@/providers/upstash/client';
import type { UpstashApiCredentials } from '@/providers/upstash/credentials';
import {
  parseUpstashList,
  upstashIndexSchema,
  upstashQstashUserSchema,
  upstashRedisDatabaseSchema,
  type UpstashIndex,
  type UpstashQstashUser,
  type UpstashRedisDatabase,
} from '@/providers/upstash/schemas';
import type { ResourceSyncResult } from '@/providers/types';

export type UpstashResourceRef = {
  externalId: string;
  displayName: string;
  resourceType: string;
  product: 'redis' | 'vector' | 'search' | 'qstash';
  metadata: Record<string, string | number | boolean | null>;
};

export async function listAllUpstashResources(
  credentials: UpstashApiCredentials,
): Promise<UpstashResourceRef[]> {
  const [redis, vector, search, qstash] = await Promise.all([
    listRedis(credentials),
    listIndexes(credentials, '/vector/index', 'vector indexes'),
    listIndexes(credentials, '/search', 'search indexes'),
    listQstash(credentials),
  ]);
  return [
    ...redis.map(redisRef),
    ...vector.map((item) => indexRef(item, 'vector', UPSTASH_VECTOR_RESOURCE_TYPE)),
    ...search.map((item) => indexRef(item, 'search', UPSTASH_SEARCH_RESOURCE_TYPE)),
    ...qstash.map(qstashRef),
  ];
}

export function toResourceSyncResult(resources: UpstashResourceRef[]): ResourceSyncResult {
  return {
    discovered: resources.map((resource) => ({
      externalId: resource.externalId,
      displayName: resource.displayName,
      resourceType: resource.resourceType,
      metadata: resource.metadata,
    })),
  };
}

async function listRedis(credentials: UpstashApiCredentials): Promise<UpstashRedisDatabase[]> {
  const raw = await upstashGetJson({ credentials, path: '/redis/databases' });
  return parseUpstashList(upstashRedisDatabaseSchema, raw, 'redis databases');
}

async function listIndexes(
  credentials: UpstashApiCredentials,
  path: '/vector/index' | '/search',
  label: string,
): Promise<UpstashIndex[]> {
  const raw = await upstashGetJson({ credentials, path });
  return parseUpstashList(upstashIndexSchema, raw, label);
}

async function listQstash(credentials: UpstashApiCredentials): Promise<UpstashQstashUser[]> {
  const raw = await upstashGetJson({ credentials, path: '/qstash/users' });
  return parseUpstashList(upstashQstashUserSchema, raw, 'qstash users');
}

function redisRef(db: UpstashRedisDatabase): UpstashResourceRef {
  return {
    externalId: db.database_id,
    displayName: db.database_name,
    resourceType: UPSTASH_REDIS_RESOURCE_TYPE,
    product: 'redis',
    metadata: {
      product: 'redis',
      plan: db.type ?? null,
      databaseType: db.database_type ?? null,
      region: db.region ?? null,
      primaryRegion: db.primary_region ?? null,
      state: db.state ?? null,
    },
  };
}

function indexRef(
  item: UpstashIndex,
  product: 'vector' | 'search',
  resourceType: string,
): UpstashResourceRef {
  return {
    externalId: item.id,
    displayName: item.name,
    resourceType,
    product,
    metadata: {
      product,
      plan: item.type ?? null,
      region: item.region ?? null,
    },
  };
}

function qstashRef(user: UpstashQstashUser): UpstashResourceRef {
  const region = user.region?.trim() || 'default';
  return {
    externalId: user.id,
    displayName: `QStash (${region})`,
    resourceType: UPSTASH_QSTASH_RESOURCE_TYPE,
    product: 'qstash',
    metadata: {
      product: 'qstash',
      plan: user.type ?? null,
      region: user.region ?? null,
      state: user.state ?? null,
      active: user.active ?? null,
    },
  };
}
