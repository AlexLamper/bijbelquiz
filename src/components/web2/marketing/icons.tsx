import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * The line icons the marketing designs draw by hand (24px grid, stroke 2.2,
 * round caps), in `currentColor` so a token class sets the colour.
 */
type IconProps = React.SVGProps<SVGSVGElement> & { size?: number; strokeWidth?: number };

function Line({ size = 22, strokeWidth = 2.2, children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export const BookIcon = (p: IconProps) => (
  <Line {...p}>
    <path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z" />
    <path d="M5 17a3 3 0 0 1 3-3h11" />
  </Line>
);

export const SwordsIcon = (p: IconProps) => (
  <Line {...p}>
    <path d="M4 4l10 10" />
    <path d="M20 4L10 14" />
    <path d="M6 15l3 3" />
    <path d="M18 15l-3 3" />
    <path d="M4 20l3-3" />
    <path d="M20 20l-3-3" />
  </Line>
);

export const PeopleIcon = (p: IconProps) => (
  <Line {...p}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
    <path d="M16 4.6a3.5 3.5 0 0 1 0 6.8" />
    <path d="M18 14.2a6.5 6.5 0 0 1 3.5 5.8" />
  </Line>
);

export const TrophyIcon = (p: IconProps) => (
  <Line {...p}>
    <path d="M8 4h8v5a4 4 0 0 1-8 0z" />
    <path d="M8 6H5a3 3 0 0 0 3 4" />
    <path d="M16 6h3a3 3 0 0 1-3 4" />
    <path d="M12 13v4" />
    <path d="M8 20h8" />
  </Line>
);

export const HomeIcon = (p: IconProps) => (
  <Line {...p}>
    <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />
  </Line>
);

export const BugIcon = (p: IconProps) => (
  <Line {...p}>
    <path d="M8 7V5.5a4 4 0 0 1 8 0V7" />
    <rect x="6" y="7" width="12" height="13" rx="6" />
    <path d="M12 11v9" />
    <path d="M6 13H3M21 13h-3M6.5 17.5L4 19.5M17.5 17.5l2.5 2M6.5 9L4 7.5M17.5 9L20 7.5" />
  </Line>
);

export const MailIcon = (p: IconProps) => (
  <Line {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3.5 7l8.5 6 8.5-6" />
  </Line>
);

export const AlertIcon = (p: IconProps) => (
  <Line {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5v5" />
    <path d="M12 16h.01" />
  </Line>
);

export const SendIcon = (p: IconProps) => (
  <Line {...p}>
    <path d="M21 3L10 14" />
    <path d="M21 3l-7 18-4-7-7-4z" />
  </Line>
);

export const PlayIcon = (p: IconProps) => (
  <Line {...p}>
    <path d="M7.5 4.8v14.4a.8.8 0 0 0 1.2.7l11.3-7.2a.8.8 0 0 0 0-1.4L8.7 4.1a.8.8 0 0 0-1.2.7z" />
  </Line>
);

export const ShieldCheckIcon = (p: IconProps) => (
  <Line {...p}>
    <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" />
    <path d="M9 12l2 2 4-4" />
  </Line>
);

export const SearchIcon = (p: IconProps) => (
  <Line {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-4-4" />
  </Line>
);

export const ChatIcon = (p: IconProps) => (
  <Line {...p}>
    <path d="M4 5h16v11H10l-5 4v-4H4z" />
  </Line>
);

export const CapIcon = (p: IconProps) => (
  <Line {...p}>
    <path d="M2 9.5l10-5 10 5-10 5z" />
    <path d="M6 11.5v4.5c3.5 2.5 8.5 2.5 12 0v-4.5" />
    <path d="M22 9.5v5" />
  </Line>
);

export const PencilIcon = (p: IconProps) => (
  <Line {...p}>
    <path d="M4 20h4L19 9l-4-4L4 16z" />
    <path d="M13.5 6.5l4 4" />
  </Line>
);

export const SparkleIcon = (p: IconProps) => (
  <Line {...p}>
    <path d="M11 3l1.9 5.1L18 10l-5.1 1.9L11 17l-1.9-5.1L4 10l5.1-1.9z" />
    <path d="M19 15v5" />
    <path d="M16.5 17.5h5" />
  </Line>
);

export const LanguagesIcon = (p: IconProps) => (
  <Line {...p}>
    <path d="M4 6h9" />
    <path d="M8.5 4v2" />
    <path d="M11 6c0 4.5-3 8-6.5 9" />
    <path d="M6.5 9.5c1.2 2.5 3.4 4.4 6 5.2" />
    <path d="M13 20l4-9 4 9" />
    <path d="M14.4 17h5.2" />
  </Line>
);

export const ExternalIcon = (p: IconProps) => (
  <Line strokeWidth={2.4} {...p}>
    <path d="M14 4h6v6" />
    <path d="M20 4l-9 9" />
    <path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" />
  </Line>
);

export const CopyIcon = (p: IconProps) => (
  <Line strokeWidth={2.4} {...p}>
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5 15V5a1 1 0 0 1 1-1h10" />
  </Line>
);

export const LockIcon = (p: IconProps) => (
  <Line strokeWidth={2.6} {...p}>
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </Line>
);

export const ChevronRightIcon = (p: IconProps) => (
  <Line strokeWidth={2.4} {...p}>
    <path d="M9 6l6 6-6 6" />
  </Line>
);

export const ChevronDownIcon = (p: IconProps) => (
  <Line strokeWidth={2.4} {...p}>
    <path d="M6 9l6 6 6-6" />
  </Line>
);

export const CheckIcon = (p: IconProps) => (
  <Line strokeWidth={3.4} {...p}>
    <path d="M5 12.5l4.5 4.5L19 7" />
  </Line>
);

/** Crown, filled gold: "Premium en betalen". */
export function CrownIcon({ size = 22, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn('fill-gold', className)}
      {...props}
    >
      <path d="M3 18L5 7l5 5 2-7 2 7 5-5 2 11z" />
    </svg>
  );
}

/** The 24px green disc with a white check, before a benefit. */
export function CheckDisc({ size = 24 }: { size?: number }) {
  return (
    <span
      aria-hidden="true"
      className="flex shrink-0 items-center justify-center rounded-full bg-green text-white"
      style={{ width: size, height: size }}
    >
      <CheckIcon size={Math.round(size * 0.54)} />
    </span>
  );
}

const TILE_TONES = {
  grey: 'bg-chip text-ink-soft',
  lapis: 'bg-lapis-tint text-lapis',
  coral: 'bg-coral-tint text-coral-text',
  green: 'bg-green-tint text-green',
  gold: 'bg-gold-tint text-gold-text',
} as const;

export type TileTone = keyof typeof TILE_TONES;

/** The rounded square behind an icon: 44px or 48px, radius 12, a soft tint. */
export function IconTile({
  tone = 'lapis',
  size = 44,
  children,
  className,
}: {
  tone?: TileTone;
  size?: 44 | 48;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn('flex shrink-0 items-center justify-center rounded-[12px]', TILE_TONES[tone], className)}
      style={{ width: size, height: size }}
    >
      {children}
    </span>
  );
}
