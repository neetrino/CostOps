import type { ReactNode } from 'react';

type DashboardBoardProps = {
  rail: ReactNode;
  children: ReactNode;
};

/** Filter rail + remaining viewport width — same density as the Neon board. */
export function DashboardBoard({ rail, children }: DashboardBoardProps) {
  return (
    <div className="flex flex-col lg:flex-row">
      {rail}
      <div className="min-w-0 flex-1 space-y-6 p-4 lg:max-w-[calc(100vw-17.5rem)] lg:p-6">
        {children}
      </div>
    </div>
  );
}
