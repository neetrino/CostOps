import { SYNC_MAX_RETRIES, SYNC_RETRY_BASE_MS } from '@/config/constants';
import { logger } from '@/shared/logger';

export type RetryOptions = {
  label: string;
  shouldRetry?: (error: unknown) => boolean;
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Retries a transient operation with exponential backoff.
 * Auth failures should set `shouldRetry` to false.
 */
export async function withBackoff<T>(fn: () => Promise<T>, options: RetryOptions): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < SYNC_MAX_RETRIES; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const retry = options.shouldRetry ? options.shouldRetry(error) : true;
      if (!retry || attempt === SYNC_MAX_RETRIES - 1) {
        break;
      }
      const wait = SYNC_RETRY_BASE_MS * 2 ** attempt;
      logger.warn({ label: options.label, attempt, wait }, 'Retry after provider/sync error');
      await delay(wait);
    }
  }
  throw lastError;
}
