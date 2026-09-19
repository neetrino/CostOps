import { beforeEach, describe, expect, it, vi } from 'vitest';
import { removeEmptyVpsAttachment } from '@/core/vps/remove-empty-attachment';
import { prisma } from '@/shared/db';

vi.mock('@/shared/db', () => ({
  prisma: {
    projectProvider: {
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe('removeEmptyVpsAttachment', () => {
  beforeEach(() => {
    vi.mocked(prisma.projectProvider.findUnique).mockReset();
    vi.mocked(prisma.projectProvider.delete).mockReset();
  });

  it('returns NOT_FOUND when the link is missing', async () => {
    vi.mocked(prisma.projectProvider.findUnique).mockResolvedValue(null);

    const result = await removeEmptyVpsAttachment('missing');

    expect(result).toEqual({
      ok: false,
      code: 'NOT_FOUND',
      message: 'VPS attachment not found',
    });
    expect(prisma.projectProvider.delete).not.toHaveBeenCalled();
  });

  it('refuses non-VPS provider links', async () => {
    vi.mocked(prisma.projectProvider.findUnique).mockResolvedValue({
      id: 'pp-neon',
      providerKey: 'NEON',
      _count: { resources: 0 },
    } as unknown as Awaited<ReturnType<typeof prisma.projectProvider.findUnique>>);

    const result = await removeEmptyVpsAttachment('pp-neon');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('CONFLICT');
    }
    expect(prisma.projectProvider.delete).not.toHaveBeenCalled();
  });

  it('refuses a VPS link that still has an active line', async () => {
    vi.mocked(prisma.projectProvider.findUnique).mockResolvedValue({
      id: 'pp-vps',
      providerKey: 'HETZNER',
      _count: { resources: 1 },
    } as unknown as Awaited<ReturnType<typeof prisma.projectProvider.findUnique>>);

    const result = await removeEmptyVpsAttachment('pp-vps');

    expect(result).toEqual({
      ok: false,
      code: 'CONFLICT',
      message: 'Stop the active VPS line first',
    });
    expect(prisma.projectProvider.delete).not.toHaveBeenCalled();
  });

  it('deletes an empty VPS leftover', async () => {
    vi.mocked(prisma.projectProvider.findUnique).mockResolvedValue({
      id: 'pp-empty',
      providerKey: 'HETZNER',
      _count: { resources: 0 },
    } as unknown as Awaited<ReturnType<typeof prisma.projectProvider.findUnique>>);
    vi.mocked(prisma.projectProvider.delete).mockResolvedValue({
      id: 'pp-empty',
    } as unknown as Awaited<ReturnType<typeof prisma.projectProvider.delete>>);

    const result = await removeEmptyVpsAttachment('pp-empty');

    expect(result).toEqual({ ok: true, data: { id: 'pp-empty' } });
    expect(prisma.projectProvider.delete).toHaveBeenCalledWith({ where: { id: 'pp-empty' } });
  });
});
