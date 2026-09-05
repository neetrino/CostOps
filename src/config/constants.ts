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

export const NEON_CREDENTIAL_REF = 'NEON';
export const NEON_CREATE_TOKEN_URL = 'https://console.neon.tech/app/settings/api-keys';
