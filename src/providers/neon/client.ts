import { NEON_API_BASE, PROVIDER_API_TIMEOUT_MS } from '@/config/constants';
import { NeonApiError } from '@/providers/neon/errors';
import { logger } from '@/shared/logger';

type NeonFetchOptions = {
  apiKey: string;
  path: string;
  searchParams: URLSearchParams;
};

/**
 * Low-level Neon Console API GET with Bearer auth. Does not log secrets.
 */
export async function neonGetJson(options: NeonFetchOptions): Promise<unknown> {
  const url = `${NEON_API_BASE}${options.path}?${options.searchParams.toString()}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROVIDER_API_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${options.apiKey}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
      signal: controller.signal,
    });
  } catch (error) {
    logger.error({ path: options.path }, 'Neon API request failed');
    throw error;
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const body = await res.text();
    logger.error({ status: res.status, path: options.path }, 'Neon API error');
    throw new NeonApiError(res.status, options.path, body.slice(0, 200));
  }

  return res.json();
}
