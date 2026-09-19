import { loadIntegrationsCached } from '@/features/dashboard/cached-shell-reads';
import { IntegrationsPage } from '@/features/integrations/integrations-page';

export const dynamic = 'force-dynamic';

export default async function IntegrationsRoute() {
  return <IntegrationsPage data={await loadIntegrationsCached()} />;
}
