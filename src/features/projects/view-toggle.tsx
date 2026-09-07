import type { ReactNode } from 'react';
import { Button } from '@/shared/ui/button';

export type BoardViewMode = 'cards' | 'list';

type ViewToggleProps = {
  mode: BoardViewMode;
  onChange: (mode: BoardViewMode) => void;
};

export function ViewToggle({ mode, onChange }: ViewToggleProps) {
  return (
    <div className="flex gap-1 rounded-[var(--radius-sm)] border border-[var(--line)] p-1">
      <ToggleButton active={mode === 'cards'} onClick={() => onChange('cards')}>
        Cards
      </ToggleButton>
      <ToggleButton active={mode === 'list'} onClick={() => onChange('list')}>
        List
      </ToggleButton>
    </div>
  );
}

function ToggleButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Button
      variant={active ? 'primary' : 'ghost'}
      className="px-3 py-1.5 text-xs"
      onClick={onClick}
    >
      {children}
    </Button>
  );
}
