'use client';

import { AppIcon } from '@/shared/ui/app-icon';

type SearchFieldProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label?: string;
  className?: string;
};

export function SearchField({
  value,
  onChange,
  placeholder,
  label = 'Search',
  className = '',
}: SearchFieldProps) {
  return (
    <label className={`block min-w-0 ${className}`}>
      <span className="sr-only">{label}</span>
      <span className="relative block">
        <AppIcon
          name="search"
          size={18}
          className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[var(--muted)]"
        />
        <input
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="field-control field-control--search min-h-11 text-sm"
        />
      </span>
    </label>
  );
}
