/**
 * Prisma unique constraint (P2002). Used to swallow alert-dedupe races.
 */
export function isPrismaUniqueViolation(error: unknown): boolean {
  return prismaErrorCode(error) === 'P2002';
}

/** Prisma record not found (P2025). */
export function isPrismaRecordNotFound(error: unknown): boolean {
  return prismaErrorCode(error) === 'P2025';
}

function prismaErrorCode(error: unknown): string | null {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return null;
  }
  return typeof error.code === 'string' ? error.code : null;
}
