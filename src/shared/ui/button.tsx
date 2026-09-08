import type { ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--accent)] text-[var(--accent-ink)] hover:bg-[var(--accent-hover)] border border-transparent shadow-[var(--shadow)]',
  secondary:
    'bg-[var(--paper-raised)] text-[var(--ink)] border border-[var(--line-strong)] hover:border-[var(--ink)] hover:bg-[var(--sunken)]',
  ghost:
    'bg-transparent text-[var(--muted)] border border-transparent hover:bg-[var(--sunken)] hover:text-[var(--ink)]',
};

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  return (
    <button
      type="button"
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-sm)] px-3.5 py-2 text-sm font-semibold transition-[color,background-color,border-color,transform,opacity] duration-[var(--duration-ui)] ease-[var(--ease-ui)] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 md:min-h-10 ${VARIANT_CLASS[variant]} ${className}`}
      {...props}
    />
  );
}
