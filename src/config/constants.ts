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
export const CRON_MAX_DURATION_SECONDS = 60;

export const CREDENTIAL_WARN_DAYS_LONG = 30;
export const CREDENTIAL_WARN_DAYS_SHORT = 7;
export const AUTH_FAILED_WINDOW_KEY = 'open';

export const DEFAULT_COST_DIMENSION_KEY = '_';
export const NEON_RESOURCE_TYPE = 'neon_project';

export const NEON_CREDENTIAL_REF = 'NEON';
export const NEON_API_BASE = 'https://console.neon.tech/api/v2';
export const NEON_CREATE_TOKEN_URL = 'https://console.neon.tech/app/settings/api-keys';
export const NEON_CREDENTIAL_DOCS_URL = 'https://neon.com/docs/manage/api-keys';
export const NEON_CREDENTIAL_CREATE_PATH = 'Organization → Settings → API keys';
export const NEON_CREDENTIAL_ENV_VARS = ['NEON_API_KEY', 'NEON_ORG_ID'] as const;

export const SYNC_NOW_RATE_LIMIT_PER_MINUTE = 5;
export const SYNC_NOW_RATE_WINDOW_MS = 60_000;
