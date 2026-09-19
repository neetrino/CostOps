import { describe, expect, it } from 'vitest';
import {
  providerChartColor,
  providerStageClass,
  providerSwatchClass,
  providerTone,
} from '@/shared/provider-tone';

describe('providerTone', () => {
  it('keeps each direction on a stable color', () => {
    expect(providerStageClass('NEON')).toBe('tone-signal');
    expect(providerSwatchClass('vercel')).toBe('bg-[var(--inverse)]');
    expect(providerChartColor('UPSTASH')).toBe('var(--violet)');
    expect(providerTone('HETZNER').swatchClass).toBe('bg-[var(--danger)]');
  });

  it('falls back for unknown keys', () => {
    expect(providerTone('GCP').stageClass).toBe('dark-stage');
  });
});
