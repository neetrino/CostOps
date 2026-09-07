export class VercelApiError extends Error {
  readonly status: number;
  readonly path: string;

  constructor(status: number, path: string, bodyPreview: string) {
    super(`Vercel API ${status}: ${bodyPreview}`);
    this.name = 'VercelApiError';
    this.status = status;
    this.path = path;
  }
}

export function isVercelAuthFailure(error: unknown): boolean {
  if (error instanceof VercelApiError) {
    return error.status === 401 || error.status === 403;
  }
  if (error instanceof Error) {
    return /Vercel API (401|403)/.test(error.message);
  }
  return false;
}
