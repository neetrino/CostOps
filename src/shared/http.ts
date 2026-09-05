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
