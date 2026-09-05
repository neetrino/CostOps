import { LOGIN_RATE_LIMIT_PER_MINUTE, LOGIN_RATE_WINDOW_MS } from '@/config/constants';

const hitsByIp = new Map<string, number[]>();

export function consumeLoginAttempt(ip: string): boolean {
  const now = Date.now();
  const recent = (hitsByIp.get(ip) ?? []).filter((stamp) => now - stamp < LOGIN_RATE_WINDOW_MS);
  if (recent.length >= LOGIN_RATE_LIMIT_PER_MINUTE) {
    hitsByIp.set(ip, recent);
    return false;
  }
  recent.push(now);
  hitsByIp.set(ip, recent);
  return true;
}

export function resetLoginRateLimit(): void {
  hitsByIp.clear();
}

export function clientIpFromHeaders(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) {
      return first;
    }
  }
  return headers.get('x-real-ip')?.trim() || 'unknown';
}
