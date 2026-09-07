export class NeonApiError extends Error {
  readonly status: number;
  readonly path: string;

  constructor(status: number, path: string, bodyPreview: string) {
    super(`Neon API ${status}: ${bodyPreview}`);
    this.name = 'NeonApiError';
    this.status = status;
    this.path = path;
  }
}

export function isNeonAuthFailure(error: unknown): boolean {
  if (error instanceof NeonApiError) {
    return error.status === 401 || error.status === 403;
  }
  if (error instanceof Error) {
    return /Neon API (401|403)/.test(error.message);
  }
  return false;
}
