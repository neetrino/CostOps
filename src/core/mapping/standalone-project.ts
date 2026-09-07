import { isUnallocatedResource } from '@/core/mapping/suggest-project';

export function standaloneProjectBlockReason(resource: {
  projectId: string | null;
  displayName: string;
  externalId: string;
  resourceType: string;
}): 'MAPPED' | 'UNALLOCATED' | null {
  if (resource.projectId) {
    return 'MAPPED';
  }
  if (isUnallocatedResource(resource)) {
    return 'UNALLOCATED';
  }
  return null;
}
