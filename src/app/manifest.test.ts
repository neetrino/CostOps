import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import manifest from '@/app/manifest';

describe('web app manifest', () => {
  it('meets the standard installable PWA fields', () => {
    const webManifest = manifest();

    expect(webManifest.name).toBe('Neetrino CostOps');
    expect(webManifest.short_name).toBe('CostOps');
    expect(webManifest.start_url).toBe('/');
    expect(webManifest.display).toBe('standalone');

    const sizes = (webManifest.icons ?? []).map((icon) => icon.sizes);
    expect(sizes).toContain('192x192');
    expect(sizes).toContain('512x512');
    expect(webManifest.icons?.some((icon) => icon.purpose === 'maskable')).toBe(true);
  });

  it('ships a Chrome-readable favicon at /favicon.ico', () => {
    expect(existsSync(resolve(process.cwd(), 'public/favicon.ico'))).toBe(true);
  });
});
