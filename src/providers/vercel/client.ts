import { PROVIDER_API_TIMEOUT_MS, VERCEL_API_BASE } from '@/config/constants';
import { VercelApiError } from '@/providers/vercel/errors';
import { logger } from '@/shared/logger';

export type VercelGetResult = {
  status: number;
  contentType: string;
  body: string;
};

type VercelGetOptions = {
  token: string;
  path: string;
  searchParams: URLSearchParams;
  allowStatuses?: readonly number[];
};

/**
 * Low-level Vercel REST GET with Bearer auth. GET only. Does not log secrets.
 */
export async function vercelGet(options: VercelGetOptions): Promise<VercelGetResult> {
  const url = `${VERCEL_API_BASE}${options.path}?${options.searchParams.toString()}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROVIDER_API_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${options.token}`,
        Accept: 'application/json, application/jsonl',
        'Accept-Encoding': 'gzip',
      },
      cache: 'no-store',
      signal: controller.signal,
    });
  } catch (error) {
    logger.error({ path: options.path }, 'Vercel API request failed');
    throw error;
  } finally {
    clearTimeout(timer);
  }

  const body = await res.text();
  const contentType = res.headers.get('content-type') ?? '';
  const allowed = options.allowStatuses ?? [];
  if (!res.ok && !allowed.includes(res.status)) {
    logger.error({ status: res.status, path: options.path }, 'Vercel API error');
    throw new VercelApiError(res.status, options.path, body.slice(0, 200));
  }
  return { status: res.status, contentType, body };
}
