/**
 * An empty discovery list is not a wipe. Failed or filtered pulls can look empty.
 */
export function shouldArchiveMissingResources(discoveredCount: number): boolean {
  return discoveredCount > 0;
}
