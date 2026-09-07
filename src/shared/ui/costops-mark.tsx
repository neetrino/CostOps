type CostOpsMarkProps = {
  size?: number;
  className?: string;
};

const ARROW = 'M9.2 2h13.6v11.2h6.4L16 30.4 2.8 13.2h6.4z';
const DOLLAR_SPINE = 'M16 8v16';
const DOLLAR_S =
  'M20.5 11.15c0-1.8-1.95-3-4.5-3s-4.5 1.15-4.5 2.85c0 3.7 9 2.15 9 6.6 0 1.9-2.05 3.25-4.5 3.25s-4.55-1.25-4.55-3.05';

/**
 * CostOps pictogram: spend-down arrow with a dollar mark.
 * Flat Flaticon geometry, Vercel-simple paths — no gradients.
 */
export function CostOpsMark({ size = 32, className }: CostOpsMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path d={ARROW} fill="#4CAF50" />
      <g
        fill="none"
        stroke="#fff"
        strokeWidth="2.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={DOLLAR_SPINE} />
        <path d={DOLLAR_S} />
      </g>
    </svg>
  );
}
