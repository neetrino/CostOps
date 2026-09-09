import type { ReactNode } from 'react';

type DashboardBoardProps = {
  rail: ReactNode;
  children: ReactNode;
};

/** Filter rail + remaining viewport width — same density as the Neon board. */
export function DashboardBoard({ rail, children }: DashboardBoardProps) {
  return (
    <div className="flex flex-col lg:min-h-[calc(100dvh-4.75rem)] lg:flex-row">
      {rail}
      <div className="min-w-0 flex-1 space-y-5 px-3 py-4 sm:px-4 lg:space-y-7 lg:p-7 xl:p-9">
        {children}
      </div>
    </div>
  );
}
