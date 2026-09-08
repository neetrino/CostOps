import type { SVGProps } from 'react';

export type AppIconName =
  | 'alert'
  | 'arrow'
  | 'check'
  | 'close'
  | 'filter'
  | 'inbox'
  | 'integrations'
  | 'menu'
  | 'projects'
  | 'provider'
  | 'search'
  | 'sync';

type AppIconProps = SVGProps<SVGSVGElement> & {
  name: AppIconName;
  size?: number;
};

export function AppIcon({ name, size = 20, ...props }: AppIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <IconPaths name={name} />
    </svg>
  );
}

function IconPaths({ name }: { name: AppIconName }) {
  switch (name) {
    case 'projects':
      return (
        <>
          <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4z" />
          <path d="M14 17h6M17 14v6" />
        </>
      );
    case 'provider':
      return (
        <>
          <circle cx="12" cy="12" r="2.5" />
          <path d="M12 3.5v4M12 16.5v4M3.5 12h4M16.5 12h4M6 6l2.8 2.8M15.2 15.2 18 18M18 6l-2.8 2.8M8.8 15.2 6 18" />
        </>
      );
    case 'inbox':
      return (
        <>
          <path d="M4 5h16l1 9v5H3v-5z" />
          <path d="M3 14h5l1.5 2h5L16 14h5" />
        </>
      );
    case 'integrations':
      return (
        <>
          <path d="M8 3v5M16 3v5M5 8h14v3a7 7 0 0 1-14 0z" />
          <path d="M12 18v3" />
        </>
      );
    case 'menu':
      return (
        <>
          <path d="M4 7h16M4 12h16M4 17h10" />
        </>
      );
    case 'close':
      return (
        <>
          <path d="m6 6 12 12M18 6 6 18" />
        </>
      );
    case 'search':
      return (
        <>
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path d="m16 16 4 4" />
        </>
      );
    case 'filter':
      return (
        <>
          <path d="M4 6h16M7 12h10M10 18h4" />
        </>
      );
    case 'sync':
      return (
        <>
          <path d="M20 7v5h-5M4 17v-5h5" />
          <path d="M18.2 9A7 7 0 0 0 6 6.8L4 9M5.8 15A7 7 0 0 0 18 17.2l2-2.2" />
        </>
      );
    case 'arrow':
      return (
        <>
          <path d="M5 12h14M14 7l5 5-5 5" />
        </>
      );
    case 'check':
      return (
        <>
          <path d="m5 12 4 4L19 6" />
        </>
      );
    case 'alert':
      return (
        <>
          <path d="M12 3 2.8 19h18.4z" />
          <path d="M12 9v4M12 17h.01" />
        </>
      );
  }
}
