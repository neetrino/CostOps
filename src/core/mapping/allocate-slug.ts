import { slugWithSuffix } from '@/core/mapping/slugify';
import { prisma } from '@/shared/db';

export async function allocateUniqueProjectSlug(base: string): Promise<string> {
  for (let attempt = 1; attempt < 50; attempt += 1) {
    const slug = slugWithSuffix(base, attempt);
    const existing = await prisma.project.findUnique({ where: { slug } });
    if (!existing) {
      return slug;
    }
  }
  return `${base}-${Date.now().toString(36)}`;
}
