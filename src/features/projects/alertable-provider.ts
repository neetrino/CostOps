import type { ProjectProviderRow } from '@/features/projects/types';
import { isFixedVpsProvider } from '@/shared/provider-label';

export function firstAlertableProvider(
  providers: ProjectProviderRow[],
): ProjectProviderRow | undefined {
  return providers.find((provider) => !isFixedVpsProvider(provider.providerKey));
}
