import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

type VercelCron = {
  path: string;
  schedule: string;
};

describe('vercel cron schedule', () => {
  it('writes the new VPS month once per UTC day', () => {
    const config = JSON.parse(readFileSync(resolve(process.cwd(), 'vercel.json'), 'utf8')) as {
      crons: VercelCron[];
    };
    const hetzner = config.crons.find((cron) => cron.path === '/api/cron/sync/hetzner');
    expect(hetzner?.schedule).toBe('30 0 * * *');
  });
});
