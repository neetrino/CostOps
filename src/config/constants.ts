export const APP_NAME = 'CostOps';
export const SERVICE_NAME = 'neetrino-costops';

export const COOKIE_NAME = 'costops_session';
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

export const LOGIN_RATE_LIMIT_PER_MINUTE = 5;
export const LOGIN_RATE_WINDOW_MS = 60_000;

export const DATABASE_POOL_MAX_DEFAULT = 5;
export const DATABASE_POOL_TIMEOUT_SECONDS_DEFAULT = 20;
export const DATABASE_STATEMENT_TIMEOUT_MS_DEFAULT = 30_000;
export const DATABASE_IDLE_IN_TX_TIMEOUT_MS = 15_000;
export const DATABASE_LOCK_TIMEOUT_MS = 10_000;

export const DEFAULT_TELEGRAM_SPEND_ALERT_USD = 1;
export const DEFAULT_SPEND_ALERT_ESCALATION_PERCENT_OF_THRESHOLD = 30;

export const DEFAULT_SYNC_INTERVAL_MINUTES = 60;
export const STALE_INTERVAL_MULTIPLIER = 2;
export const SYNC_MAX_RETRIES = 3;
export const SYNC_RETRY_BASE_MS = 500;
export const PROVIDER_API_TIMEOUT_MS = 60_000;
/** Vercel Pro function cap. Must exceed one provider pull (60s outbound) × 3 accounts + alerts. */
export const CRON_MAX_DURATION_SECONDS = 300;
/** Stop starting another account so Vercel does not kill the function mid-write. */
export const SYNC_BATCH_RESERVE_SECONDS = 15;

export const CREDENTIAL_WARN_DAYS_LONG = 30;
export const CREDENTIAL_WARN_DAYS_SHORT = 7;
export const AUTH_FAILED_WINDOW_KEY = 'open';

export const DEFAULT_COST_DIMENSION_KEY = '_';
export const NEON_RESOURCE_TYPE = 'neon_project';
export const VERCEL_RESOURCE_TYPE = 'vercel_project';
export const VERCEL_UNALLOCATED_RESOURCE_TYPE = 'vercel_unallocated';
export const VERCEL_UNALLOCATED_EXTERNAL_ID = '_unallocated';

export const NEON_CREDENTIAL_REF = 'NEON';
export const NEON_API_BASE = 'https://console.neon.tech/api/v2';
export const NEON_CREATE_TOKEN_URL = 'https://console.neon.tech/app/settings/api-keys';
export const NEON_CREDENTIAL_DOCS_URL = 'https://neon.com/docs/manage/api-keys';
export const NEON_CREDENTIAL_CREATE_PATH = 'Organization → Settings → API keys';
export const NEON_CREDENTIAL_ENV_VARS = ['NEON_API_KEY', 'NEON_ORG_ID'] as const;

export const VERCEL_CREDENTIAL_REF = 'VERCEL';
export const VERCEL_API_BASE = 'https://api.vercel.com';
export const VERCEL_CREATE_TOKEN_URL = 'https://vercel.com/account/tokens';
export const VERCEL_CREDENTIAL_DOCS_URL = 'https://vercel.com/docs/accounts/access-tokens';
export const VERCEL_CREDENTIAL_CREATE_PATH = 'Personal Account → Tokens';
export const VERCEL_CREDENTIAL_ENV_VARS = ['VERCEL_API_TOKEN', 'VERCEL_TEAM_ID'] as const;
export const VERCEL_BILLING_TIME_ZONE = 'America/Los_Angeles';
export const VERCEL_PROJECT_PAGE_SIZE = 100;
export const VERCEL_PROJECT_PAGE_LIMIT = 50;

export const UPSTASH_CREDENTIAL_REF = 'UPSTASH';
export const UPSTASH_API_BASE = 'https://api.upstash.com/v2';
export const UPSTASH_CREATE_TOKEN_URL = 'https://console.upstash.com/account/api';
export const UPSTASH_CREDENTIAL_DOCS_URL =
  'https://upstash.com/docs/devops/developer-api/authentication';
export const UPSTASH_CREDENTIAL_CREATE_PATH = 'Account → Management API';
export const UPSTASH_CREDENTIAL_ENV_VARS = ['UPSTASH_EMAIL', 'UPSTASH_API_KEY'] as const;
export const UPSTASH_REDIS_RESOURCE_TYPE = 'upstash_redis';
export const UPSTASH_VECTOR_RESOURCE_TYPE = 'upstash_vector';
export const UPSTASH_SEARCH_RESOURCE_TYPE = 'upstash_search';
export const UPSTASH_QSTASH_RESOURCE_TYPE = 'upstash_qstash';

export const HETZNER_CREDENTIAL_REF = 'HETZNER_FIXED';
export const HETZNER_EXTERNAL_ACCOUNT_ID = 'internal';
export const HETZNER_DISPLAY_NAME = 'VPS';
export const HETZNER_RESOURCE_TYPE = 'vps_server';
export const HETZNER_FIXED_SYNC_INTERVAL_MINUTES = 1440;

export const SYNC_NOW_RATE_LIMIT_PER_MINUTE = 12;
export const SYNC_NOW_RATE_WINDOW_MS = 60_000;
export const MAX_BACKFILL_DAYS = 31;
export const BACKFILL_MAX_DURATION_SECONDS = 120;

export const MAX_DASHBOARD_RANGE_DAYS = 400;
export const NEAR_LIMIT_USAGE_PERCENT = 70;
export const NEAR_LIMIT_MAX_ROWS = 20;
export const ALERT_EVENT_QUERY_LIMIT = 500;
export const UNMAPPED_RESOURCE_QUERY_LIMIT = 500;
export const UNMAPPED_INBOX_PREVIEW_LIMIT = 8;
export const UNMAPPED_INBOX_DISMISS_STORAGE_KEY = 'costops.unmapped-inbox.dismissed';
export const SUGGEST_PROJECT_MIN_SCORE = 0.8;
export const SUGGEST_PROJECT_AMBIGUITY_DELTA = 0.08;
export const COST_SERIES_METRIC = 'cost';
export const MS_PER_DAY = 86_400_000;
