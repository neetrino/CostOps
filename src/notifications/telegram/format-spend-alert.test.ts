import { describe, expect, it } from 'vitest';
import { formatSpendAlertTelegramHtml } from '@/notifications/telegram/format-spend-alert';

const day = new Date('2026-09-07T00:00:00.000Z');

describe('formatSpendAlertTelegramHtml', () => {
  it('matches the Neon compact layout for a first breach', () => {
    const html = formatSpendAlertTelegramHtml({
      projectName: 'NBOS',
      providerName: 'Neon',
      budgetDate: day,
      spendUsd: 1.09,
      limitUsd: 1,
      kind: 'first',
    });
    expect(html).toBe(
      [
        'Neon',
        '',
        '📦 <b>NBOS</b>',
        '',
        '📅 Day 07',
        '',
        '💵 Estimated $1.09',
        '',
        '🎯 Limit $1.00',
      ].join('\n'),
    );
  });

  it('adds the escalation delta like Neon', () => {
    const html = formatSpendAlertTelegramHtml({
      projectName: 'Degusto',
      providerName: 'Vercel',
      budgetDate: day,
      spendUsd: 2.67,
      limitUsd: 2,
      kind: 'escalation',
      previousNotifiedSpendUsd: 2.01,
    });
    expect(html).toContain('Vercel');
    expect(html).toContain('📦 <b>Degusto</b>');
    expect(html).toContain('↑ $0.66 since last alert');
  });

  it('escapes HTML in the project name', () => {
    const html = formatSpendAlertTelegramHtml({
      projectName: 'A <b>x</b> & y',
      providerName: 'Neon',
      budgetDate: day,
      spendUsd: 2,
      limitUsd: 1,
      kind: 'first',
    });
    expect(html).toContain('<b>A &lt;b&gt;x&lt;/b&gt; &amp; y</b>');
  });
});
