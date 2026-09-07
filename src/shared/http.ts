import { NextResponse } from 'next/server';

export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
  };
};

export function jsonError(
  code: string,
  message: string,
  status: number,
): NextResponse<ApiErrorBody> {
  return NextResponse.json({ error: { code, message } }, { status });
}

export function safeErrorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : 'Unknown error';
  return raw.replace(/Bearer\s+\S+/gi, 'Bearer [redacted]').slice(0, 500);
}

export function parseRequestQuery(request: Request): Record<string, string | undefined> {
  const params = new URL(request.url).searchParams;
  const query: Record<string, string | undefined> = {};
  for (const [key, value] of params.entries()) {
    query[key] = value;
  }
  return query;
}

export async function readJsonBody(
  request: Request,
): Promise<{ ok: true; value: unknown } | { ok: false; response: NextResponse<ApiErrorBody> }> {
  try {
    return { ok: true, value: await request.json() };
  } catch {
    return { ok: false, response: jsonError('VALIDATION_ERROR', 'Invalid JSON', 400) };
  }
}
