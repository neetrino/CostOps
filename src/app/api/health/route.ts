import { NextResponse } from 'next/server';

/**
 * Liveness probe. Does not touch the database or validate full env.
 */
export function GET(): NextResponse {
  return NextResponse.json({ ok: true, service: 'costops' });
}
