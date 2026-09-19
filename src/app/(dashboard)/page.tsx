import { loadProjectsBoardCached } from '@/features/projects';
import { ProjectsPage } from '@/features/projects/projects-page';
import { resolveSearchParamsQuery } from '@/shared/dashboard-query';
import { ErrorPanel } from '@/shared/ui/state-panels';

export const dynamic = 'force-dynamic';

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function HomePage({ searchParams }: PageProps) {
  const parsed = resolveSearchParamsQuery(await searchParams);
  if (!parsed.ok) {
    return <ErrorPanel message={parsed.message} />;
  }
  return <ProjectsPage board={await loadProjectsBoardCached(parsed.data)} />;
}
