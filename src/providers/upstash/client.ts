import { PROVIDER_API_TIMEOUT_MS, UPSTASH_API_BASE } from '@/config/constants';
import {
  upstashBasicAuthHeader,
  type UpstashApiCredentials,
} from '@/providers/upstash/credentials';
import { UpstashApiError } from '@/providers/upstash/errors';
import { logger } from '@/shared/logger';

type UpstashGetOptions = {
  credentials: UpstashApiCredentials;
  path: string;
  searchParams?: URLSearchParams;
};

/**
 * Low-level Upstash Management API GET with Basic auth. GET only.
 * Does not log credentials or response bodies (list payloads include tokens).
 */
export async function upstashGetJson(options: UpstashGetOptions): Promise<unknown> {
  const query = options.searchParams?.toString() ?? '';
  const url = query
    ? `${UPSTASH_API_BASE}${options.path}?${query}`
    : `${UPSTASH_API_BASE}${options.path}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROVIDER_API_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: upstashBasicAuthHeader(options.credentials),
        Accept: 'application/json',
      },
      cache: 'no-store',
      signal: controller.signal,
    });
  } catch (error) {
    logger.error({ path: options.path }, 'Upstash API request failed');
    throw error;
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const body = await res.text();
    logger.error({ status: res.status, path: options.path }, 'Upstash API error');
    throw new UpstashApiError(res.status, options.path, body.slice(0, 200));
  }

  return res.json();
}
