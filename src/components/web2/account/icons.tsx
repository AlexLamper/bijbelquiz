import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

/** The filled gold crown of the Premium rows and cards. */
export function CrownSolidIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="var(--gold)"
      stroke="var(--gold-text)"
      strokeWidth={1.6}
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M3 18L5 7l5 5 2-7 2 7 5-5 2 11z" />
    </svg>
  );
}
