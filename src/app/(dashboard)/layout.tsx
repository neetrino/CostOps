import { loadInboxStatusCached, loadSyncStatusCached } from '@/features/dashboard/cached-shell-reads';
import { DashboardShell } from '@/features/dashboard/dashboard-shell';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [sync, inbox] = await Promise.all([loadSyncStatusCached(), loadInboxStatusCached()]);
  return (
    <DashboardShell sync={sync} inbox={inbox}>
      {children}
    </DashboardShell>
  );
}
