import { describe, expect, it } from 'vitest';
import { shouldShowUnmappedInbox } from '@/core/mapping/inbox-dismiss';

describe('shouldShowUnmappedInbox', () => {
  it('hides when the inbox is empty', () => {
    expect(shouldShowUnmappedInbox(0, null)).toBe(false);
  });

  it('shows on a new visit when work exists', () => {
    expect(shouldShowUnmappedInbox(12, null)).toBe(true);
  });

  it('hides after dismiss while the count is unchanged', () => {
    expect(shouldShowUnmappedInbox(12, 12)).toBe(false);
  });

  it('shows again when new unmapped rows appear', () => {
    expect(shouldShowUnmappedInbox(13, 12)).toBe(true);
  });
});
