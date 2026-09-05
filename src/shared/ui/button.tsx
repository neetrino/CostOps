import type { ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: 'bg-[var(--accent)] text-[var(--accent-ink)] hover:opacity-90 border border-transparent',
  secondary:
    'bg-[var(--paper)] text-[var(--ink)] border border-[var(--line-strong)] hover:border-[var(--ink)]',
  ghost: 'bg-transparent text-[var(--muted)] border border-transparent hover:text-[var(--ink)]',
};

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center rounded-[var(--radius-sm)] px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT_CLASS[variant]} ${className}`}
      {...props}
    />
  );
}
