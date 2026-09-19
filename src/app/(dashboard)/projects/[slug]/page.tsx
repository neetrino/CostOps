import { loadProjectDetailBoardCached } from '@/features/projects';
import { ProjectDetailPage } from '@/features/projects/project-detail-page';
import { resolveSearchParamsQuery } from '@/shared/dashboard-query';
import { EmptyPanel, ErrorPanel } from '@/shared/ui/state-panels';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProjectDetailRoute({ params, searchParams }: PageProps) {
  const parsed = resolveSearchParamsQuery(await searchParams);
  if (!parsed.ok) {
    return <ErrorPanel message={parsed.message} />;
  }
  const { slug } = await params;
  const board = await loadProjectDetailBoardCached(slug, parsed.data);
  if (!board) {
    return <EmptyPanel title="Project not found" detail="Check the slug or return to Projects." />;
  }
  return <ProjectDetailPage board={board} />;
}
