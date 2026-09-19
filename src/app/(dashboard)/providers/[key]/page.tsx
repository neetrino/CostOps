import { loadProviderDetailBoardCached } from '@/features/providers';
import { ProviderDetailPage } from '@/features/providers/provider-detail-page';
import { parseProviderKeyParam, resolveSearchParamsQuery } from '@/shared/dashboard-query';
import { EmptyPanel, ErrorPanel } from '@/shared/ui/state-panels';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ key: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProviderDetailRoute({ params, searchParams }: PageProps) {
  const parsed = resolveSearchParamsQuery(await searchParams);
  if (!parsed.ok) {
    return <ErrorPanel message={parsed.message} />;
  }
  const providerKey = parseProviderKeyParam((await params).key);
  if (!providerKey) {
    return <EmptyPanel title="Provider not found" detail="Unknown provider key." />;
  }
  const board = await loadProviderDetailBoardCached(providerKey, parsed.data);
  if (!board) {
    return <EmptyPanel title="Provider not found" detail="Unknown provider key." />;
  }
  return <ProviderDetailPage board={board} />;
}
