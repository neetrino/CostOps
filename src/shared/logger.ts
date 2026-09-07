import pino from 'pino';
import { SERVICE_NAME } from '@/config/constants';

const isProd = process.env.NODE_ENV === 'production';
const level = process.env.LOG_LEVEL ?? (isProd ? 'info' : 'debug');

/** Structured logger; avoid raw console in application paths. */
export const logger = pino({
  level,
  base: { service: SERVICE_NAME },
});
