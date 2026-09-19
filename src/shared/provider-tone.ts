import {
  parseRegisteredProviderKey,
  type RegisteredProviderKey,
} from '@/shared/registered-providers';

export type ProviderTone = {
  stageClass: string;
  swatchClass: string;
  chartColor: string;
};

const FALLBACK_TONE: ProviderTone = {
  stageClass: 'dark-stage',
  swatchClass: 'bg-[var(--inverse)]',
  chartColor: 'var(--inverse)',
};

const PROVIDER_TONES: Record<RegisteredProviderKey, ProviderTone> = {
  NEON: {
    stageClass: 'tone-signal',
    swatchClass: 'bg-[var(--signal)]',
    chartColor: 'var(--signal)',
  },
  VERCEL: {
    stageClass: 'dark-stage',
    swatchClass: 'bg-[var(--inverse)]',
    chartColor: 'var(--chart-9)',
  },
  UPSTASH: {
    stageClass: 'tone-violet',
    swatchClass: 'bg-[var(--violet)]',
    chartColor: 'var(--violet)',
  },
  HETZNER: {
    stageClass: 'tone-danger',
    swatchClass: 'bg-[var(--danger)]',
    chartColor: 'var(--danger)',
  },
};

/** Stable brand tone for a provider — cards, dots, and series share this map. */
export function providerTone(providerKey: string): ProviderTone {
  const key = parseRegisteredProviderKey(providerKey);
  return key ? PROVIDER_TONES[key] : FALLBACK_TONE;
}

export function providerStageClass(providerKey: string): string {
  return providerTone(providerKey).stageClass;
}

export function providerSwatchClass(providerKey: string): string {
  return providerTone(providerKey).swatchClass;
}

export function providerChartColor(providerKey: string): string {
  return providerTone(providerKey).chartColor;
}
