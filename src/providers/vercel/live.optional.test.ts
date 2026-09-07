import { config } from 'dotenv';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { fetchVercelCharges } from '@/providers/vercel/fetch-charges';
import { listAllVercelProjects } from '@/providers/vercel/list-projects';
import { getYesterdayUtc } from '@/shared/dates';

config({ path: resolve(process.cwd(), '.env') });

const token = process.env.VERCEL_API_TOKEN?.trim();
const teamId = process.env.VERCEL_TEAM_ID?.trim();
const live = Boolean(token && teamId);

describe.skipIf(!live)('Vercel live probe (optional)', () => {
  it('lists team projects and fetches yesterday FOCUS charges', async () => {
    if (!token || !teamId) {
      return;
    }
    const projects = await listAllVercelProjects({ token, teamId });
    expect(projects.length).toBeGreaterThan(0);
    expect(projects[0]?.id.startsWith('prj_')).toBe(true);

    const charges = await fetchVercelCharges({
      token,
      teamId,
      utcDay: getYesterdayUtc(),
    });
    expect(charges.kind === 'ok' || charges.kind === 'missing').toBe(true);
    if (charges.kind === 'ok') {
      expect(Array.isArray(charges.charges)).toBe(true);
    }
  }, 20_000);
});
