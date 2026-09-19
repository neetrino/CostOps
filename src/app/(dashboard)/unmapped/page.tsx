import { UnmappedPage } from '@/features/unmapped/unmapped-page';
import { loadUnmappedBoardCached } from '@/features/unmapped/load-unmapped-board';
import { flattenSearchParams, resolveSearchParamsQuery } from '@/shared/dashboard-query';
import { ErrorPanel } from '@/shared/ui/state-panels';

export const dynamic = 'force-dynamic';

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function UnmappedRoute({ searchParams }: PageProps) {
  const raw = await searchParams;
  const parsed = resolveSearchParamsQuery(raw);
  if (!parsed.ok) {
    return <ErrorPanel message={parsed.message} />;
  }
  const tab = flattenSearchParams(raw).inbox === 'archived' ? 'archived' : 'open';
  return <UnmappedPage board={await loadUnmappedBoardCached(parsed.data, tab)} />;
}
