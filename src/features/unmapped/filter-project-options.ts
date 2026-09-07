import type { InboxProjectOption } from '@/features/unmapped/types';

export function duplicateProjectNames(projects: readonly InboxProjectOption[]): Set<string> {
  const counts = new Map<string, number>();
  for (const project of projects) {
    const key = project.name.trim().toLowerCase();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return new Set([...counts.entries()].filter(([, count]) => count > 1).map(([name]) => name));
}

export function filterAndRankProjectOptions(
  projects: readonly InboxProjectOption[],
  query: string,
  suggestedProjectId: string | null,
): InboxProjectOption[] {
  const term = query.trim().toLowerCase();
  const matched = term
    ? projects.filter((project) => projectMatchesQuery(project, term))
    : [...projects];
  return matched.sort((left, right) => {
    if (left.id === suggestedProjectId) {
      return -1;
    }
    if (right.id === suggestedProjectId) {
      return 1;
    }
    const byName = left.name.localeCompare(right.name, 'en', { sensitivity: 'base' });
    if (byName !== 0) {
      return byName;
    }
    return left.slug.localeCompare(right.slug);
  });
}

function projectMatchesQuery(project: InboxProjectOption, term: string): boolean {
  if (project.name.toLowerCase().includes(term) || project.slug.toLowerCase().includes(term)) {
    return true;
  }
  return project.providerKeys.some((key) => key.toLowerCase().includes(term));
}
