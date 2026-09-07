export class UnauthorizedError extends Error {
  constructor() {
    super('Unauthorized');
    this.name = 'UnauthorizedError';
  }
}

export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (res.status === 401) {
    throw new UnauthorizedError();
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(messageFromApiBody(text, res.statusText));
  }
  return res.json() as Promise<T>;
}

function messageFromApiBody(text: string, fallback: string): string {
  try {
    const body = JSON.parse(text) as { error?: { message?: string } | string };
    if (typeof body.error === 'string' && body.error.length > 0) {
      return body.error;
    }
    if (typeof body.error === 'object' && body.error?.message) {
      return body.error.message;
    }
  } catch {
    // Body is not the standard error envelope.
  }
  return text || fallback;
}
