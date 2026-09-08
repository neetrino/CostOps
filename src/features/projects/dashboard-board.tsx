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
      <div className="min-w-0 flex-1 space-y-5 px-3 py-4 sm:px-4 lg:max-w-[calc(100vw-17.5rem)] lg:space-y-6 lg:p-6 xl:p-8">
        {children}
      </div>
    </div>
  );
}
