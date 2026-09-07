export function slugifyName(name: string, fallback: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return slug.length > 0 ? slug : fallback.toLowerCase().replace(/[^a-z0-9-]+/g, '-');
}

export function slugWithSuffix(base: string, attempt: number): string {
  if (attempt <= 1) {
    return base;
  }
  return `${base}-${attempt}`;
}
