import type { SVGProps } from 'react';

/**
 * The handful of icons the designs draw by hand (streak flame, XP bolt, the
 * logo mark). Everything else comes from lucide-react, which the designs
 * also use for their line icons (stroke 2.2, round caps).
 */

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

export function FlameIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 2s5 4.5 5 10a5 5 0 0 1-10 0c0-2.5 1.5-4.2 2.5-5 0 2 1 3 2 3 0-3.5.5-6 .5-8z" />
    </svg>
  );
}

export function BoltIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="var(--gold)"
      stroke="var(--gold-edge)"
      strokeWidth={1.6}
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M13 2L4 14h7l-1 8 9-12h-7z" />
    </svg>
  );
}

/** Solid bolt in the current text colour (inside gold pills). */
export function BoltSolidIcon({ size = 14, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M13 2L4 14h7l-1 8 9-12h-7z" />
    </svg>
  );
}

/** The speech-bubble book with a question mark: the BijbelQuiz mark. */
export function LogoMark({ size = 34, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-hidden="true" {...props}>
      <path
        d="M12 24Q31 13 50 23Q69 13 88 24L88 71Q69 63 50 73Q42 69 36 69L24 86L25 69.5Q18 70 12 72Z"
        fill="#263E69"
        stroke="#263E69"
        strokeWidth={8}
        strokeLinejoin="round"
        transform="translate(0 5)"
      />
      <path
        d="M12 24Q31 13 50 23Q69 13 88 24L88 71Q69 63 50 73Q42 69 36 69L24 86L25 69.5Q18 70 12 72Z"
        fill="#35548C"
        stroke="#35548C"
        strokeWidth={8}
        strokeLinejoin="round"
      />
      <path d="M18 30Q32 22 46 30L46 64Q32 59 18 63Z" fill="#FFFFFF" stroke="#FFFFFF" strokeWidth={3} strokeLinejoin="round" />
      <path d="M54 30Q68 22 82 30L82 63Q68 59 54 64Z" fill="#FFFFFF" stroke="#FFFFFF" strokeWidth={3} strokeLinejoin="round" />
      <path d="M24 40Q32 36 40 40M24 50Q32 46 40 50" stroke="#35548C" strokeWidth={5} strokeLinecap="round" fill="none" />
      <path
        d="M61.5 39Q61.5 31.5 68 31.5Q74.5 31.5 74.5 37.5Q74.5 41.5 70.5 43.5Q68 44.8 68 48"
        stroke="#35548C"
        strokeWidth={6}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx={68} cy={56} r={4.4} fill="#E9B12E" />
    </svg>
  );
}

export function AppleIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M16.4 12.6c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9-.7 0-1.8-.9-3-.8-1.5 0-2.9.9-3.7 2.3-1.6 2.8-.4 6.8 1.1 9 .8 1.1 1.7 2.3 2.9 2.3 1.2 0 1.6-.8 3-.8s1.8.8 3 .7c1.3 0 2-1.1 2.8-2.2.9-1.3 1.2-2.5 1.2-2.6 0 0-2.4-.9-2.4-3.5zM14.1 5.8c.6-.8 1.1-1.9.9-3-.9 0-2.1.6-2.7 1.4-.6.7-1.1 1.8-1 2.9 1.1.1 2.1-.5 2.8-1.3z" />
    </svg>
  );
}

export function GoogleIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.4c-.2 1.2-.9 2.3-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.4z" />
      <path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6C4.7 19.8 8.1 22 12 22z" />
      <path fill="#FBBC05" d="M6.4 14c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.4H3.1C2.4 8.8 2 10.4 2 12s.4 3.2 1.1 4.6L6.4 14z" />
      <path fill="#EA4335" d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.9-2.9C17 2.9 14.7 2 12 2 8.1 2 4.7 4.2 3.1 7.4L6.4 10c.8-2.3 3-4.1 5.6-4.1z" />
    </svg>
  );
}
