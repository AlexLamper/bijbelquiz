import * as React from 'react';

/**
 * Small drawings from the approved designs (P-Dashboard topic tiles, the
 * duel badge, the quiz of the day). Theme colours come from the tokens; the
 * few neutral stone and parchment tones that only exist in these drawings are
 * kept as drawn, like the quiz scenes.
 */

type ArtProps = React.SVGProps<SVGSVGElement>;

/** Two stone tablets: "Oude Testament". */
export function TabletsArt(props: ArtProps) {
  return (
    <svg width="80" height="80" viewBox="0 0 64 64" fill="none" aria-hidden="true" {...props}>
      <path d="M8 60V24a12 12 0 0 1 24 0v36z" fill="#D8D2C4" stroke="#6F6758" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M32 60V24a12 12 0 0 1 24 0v36z" fill="#E6E1D5" stroke="#6F6758" strokeWidth="2.5" strokeLinejoin="round" />
      <path
        d="M14 29h12M14 35h12M14 41h12M14 47h8M38 29h12M38 35h12M38 41h12M38 47h8"
        stroke="#8E8676"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** A cross against a low sun: "Nieuwe Testament". */
export function CrossArt(props: ArtProps) {
  return (
    <svg width="82" height="82" viewBox="0 0 64 64" fill="none" aria-hidden="true" {...props}>
      <circle cx="42" cy="22" r="15" fill="var(--gold-wash)" />
      <path d="M0 64Q30 44 64 58V64Z" fill="var(--lapis-pale)" />
      <path
        d="M28 8h8v13h11v8H36v31h-8V29H17v-8h11z"
        fill="var(--lapis)"
        stroke="var(--lapis-edge)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** An open book with a question mark: "Algemeen". */
export function OpenBookArt(props: ArtProps) {
  return (
    <svg width="84" height="84" viewBox="0 0 64 64" fill="none" aria-hidden="true" {...props}>
      <path
        d="M4 30c9-5 19-5 28 1 9-6 19-6 28-1v28c-9-5-19-5-28 1-9-6-19-6-28-1z"
        fill="#FFFFFF"
        stroke="var(--gold-text)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path d="M32 31v28" stroke="var(--gold-text)" strokeWidth="2.5" />
      <path d="M10 39q6-3 16 0M10 46q6-3 16 0M38 39q6-3 16 0M38 46q6-3 16 0" stroke="#D6B565" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="32" cy="16" r="11" fill="var(--gold)" stroke="#A87C14" strokeWidth="2" />
      <path
        d="M28.5 13.5q0-3.5 3.5-3.5t3.5 3.2q0 2.3-2.2 3.3-1.3.6-1.3 2.2"
        stroke="var(--gold-ink)"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="32" cy="22.4" r="1.5" fill="var(--gold-ink)" />
    </svg>
  );
}

/** A crown: "Thema's". */
export function CrownArt(props: ArtProps) {
  return (
    <svg width="78" height="78" viewBox="0 0 64 64" fill="none" aria-hidden="true" {...props}>
      <path d="M10 46L14 20 25 32 32 14 39 32 50 20 54 46z" fill="var(--gold)" stroke="#A87C14" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M10 46h44v9H10z" fill="#D9A11F" stroke="#A87C14" strokeWidth="2.5" strokeLinejoin="round" />
      <circle cx="14" cy="18" r="3.5" fill="#FFFFFF" stroke="#A87C14" strokeWidth="2" />
      <circle cx="32" cy="12" r="3.5" fill="#FFFFFF" stroke="#A87C14" strokeWidth="2" />
      <circle cx="50" cy="18" r="3.5" fill="#FFFFFF" stroke="#A87C14" strokeWidth="2" />
      <circle cx="22" cy="50.5" r="2.6" fill="var(--coral)" />
      <circle cx="32" cy="50.5" r="2.6" fill="var(--lapis)" />
      <circle cx="42" cy="50.5" r="2.6" fill="var(--green)" />
    </svg>
  );
}

/** The crossed swords of a duel. Uses `currentColor`. */
export function SwordsIcon({ size = 12, strokeWidth = 3, ...props }: ArtProps & { size?: number }) {
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
      <path d="M4 4l10 10" />
      <path d="M20 4L10 14" />
      <path d="M6 15l3 3" />
      <path d="M18 15l-3 3" />
      <path d="M4 20l3-3" />
      <path d="M20 20l-3-3" />
    </svg>
  );
}

/** The closed book used for "Quizzen gespeeld" and the passage card. Uses `currentColor`. */
export function BookIcon({ size = 20, strokeWidth = 2.2, ...props }: ArtProps & { size?: number }) {
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
      <path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z" />
      <path d="M5 17a3 3 0 0 1 3-3h11" />
    </svg>
  );
}

/** Jozef's coat, the drawing the approved quiz of the day carries. */
export function CoatArt(props: ArtProps) {
  return (
    <svg width="150" height="100" viewBox="0 0 96 64" fill="none" aria-hidden="true" {...props}>
      <path d="M36 8h24l14 12-8 8-4-4v36H34V24l-4 4-8-8z" fill="#FFFFFF" stroke="var(--lapis-edge)" strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M34 30h28v6H34z" fill="var(--coral)" />
      <path d="M34 40h28v6H34z" fill="var(--gold)" />
      <path d="M34 50h28v6H34z" fill="var(--green)" />
      <path d="M34 22h28v4H34z" fill="var(--lapis)" />
      <path d="M36 8h24l14 12-8 8-4-4v36H34V24l-4 4-8-8z" stroke="var(--lapis-edge)" strokeWidth="2.4" strokeLinejoin="round" />
    </svg>
  );
}
