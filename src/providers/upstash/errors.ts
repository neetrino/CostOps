export class UpstashApiError extends Error {
  readonly status: number;
  readonly path: string;

  constructor(status: number, path: string, bodyPreview: string) {
    super(`Upstash API ${status}: ${bodyPreview}`);
    this.name = 'UpstashApiError';
    this.status = status;
    this.path = path;
  }
}

export function isUpstashAuthFailure(error: unknown): boolean {
  if (error instanceof UpstashApiError) {
    return error.status === 401 || error.status === 403;
  }
  if (error instanceof Error) {
    return /Upstash API (401|403)/.test(error.message);
  }
  return false;
}
