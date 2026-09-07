/** Show the inbox popup on every visit, and again if the open count grows. */
export function shouldShowUnmappedInbox(
  unmappedCount: number,
  dismissedCount: number | null,
): boolean {
  if (unmappedCount <= 0) {
    return false;
  }
  if (dismissedCount === null) {
    return true;
  }
  return unmappedCount > dismissedCount;
}
