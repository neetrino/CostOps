import { describe, expect, it } from 'vitest';
import {
  parseUpstashList,
  upstashQstashUserSchema,
  upstashRedisDatabaseSchema,
} from '@/providers/upstash/schemas';

describe('Upstash Zod fixtures', () => {
  it('keeps Redis identity fields and drops rest tokens', () => {
    const parsed = parseUpstashList(
      upstashRedisDatabaseSchema,
      [
        {
          database_id: '3bf08a7d-32c4-4e9f-b1a7-18293ddb3d85',
          database_name: 'Grill.am',
          type: 'paid',
          database_type: 'Pay as You Go',
          region: 'global',
          primary_region: 'eu-central-1',
          state: 'active',
          read_only_rest_token: 'should-not-parse-through',
        },
      ],
      'redis databases',
    );
    expect(parsed[0]?.database_id).toBe('3bf08a7d-32c4-4e9f-b1a7-18293ddb3d85');
    expect(parsed[0]).not.toHaveProperty('read_only_rest_token');
  });

  it('keeps QStash identity and drops tokens', () => {
    const parsed = parseUpstashList(
      upstashQstashUserSchema,
      [
        {
          id: '018dc024-b46b-4bdc-8600-364d24dc71ed',
          state: 'active',
          active: true,
          type: 'paid',
          region: 'eu-central-1',
          token: 'secret',
          read_only_token: 'secret',
        },
      ],
      'qstash users',
    );
    expect(parsed[0]?.region).toBe('eu-central-1');
    expect(parsed[0]).not.toHaveProperty('token');
    expect(parsed[0]).not.toHaveProperty('read_only_token');
  });

  it('rejects a malformed Redis list item', () => {
    expect(() => parseUpstashList(upstashRedisDatabaseSchema, [{ name: 'nope' }], 'redis')).toThrow(
      /Invalid Upstash redis/,
    );
  });
});
