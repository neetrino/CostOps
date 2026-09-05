/**
 * Prisma unique constraint (P2002). Used to swallow alert-dedupe races.
 */
export function isPrismaUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: unknown }).code === 'P2002'
  );
}
