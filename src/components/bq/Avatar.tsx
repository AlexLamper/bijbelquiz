import * as React from 'react';
/* eslint-disable @next/next/no-img-element */

import { cn } from '@/lib/utils';
import type { AvatarConfig } from '@/lib/avatar';
import MascotAvatar from '@/components/avatar/MascotAvatar';

/**
 * Round player avatar with the person's initial in Fredoka, as the designs
 * draw it. `tone="solid"` is the filled lapis circle the designs use for the
 * signed-in player; the tints are for other players. `tone="auto"` picks a
 * tint from the name so a list never shows the same colour twice in a row.
 *
 * A stored mascot (`avatar` config) or a photo (`image`) is drawn instead of
 * the initial when given, so accounts that customised their mascot keep it.
 */
export type AvatarTone = 'solid' | 'lapis' | 'coral' | 'green' | 'gold' | 'grey' | 'auto';

export interface AvatarProps {
  name?: string | null;
  size?: number;
  tone?: AvatarTone;
  image?: string | null;
  avatar?: AvatarConfig | null;
  /** Ring colour, e.g. the podium in the ranglijst. */
  ring?: 'gold' | 'silver' | 'bronze' | 'lapis';
  /** Something pinned to the bottom edge, such as a rank number. */
  badge?: React.ReactNode;
  className?: string;
  title?: string;
}

const TONES: Record<Exclude<AvatarTone, 'auto'>, string> = {
  solid: 'bg-lapis text-white',
  lapis: 'bg-lapis-tint text-lapis',
  coral: 'bg-coral-tint text-coral-text',
  green: 'bg-green-tint text-green-text',
  gold: 'bg-gold-tint text-gold-text',
  grey: 'bg-chip text-ink-soft',
};

const AUTO_TONES: Exclude<AvatarTone, 'auto' | 'solid'>[] = ['lapis', 'coral', 'green', 'gold'];

const RINGS = {
  gold: 'border-[3px] border-gold',
  silver: 'border-[3px] border-silver',
  bronze: 'border-[3px] border-bronze',
  lapis: 'border-[3px] border-lapis',
} as const;

export function avatarToneFor(name: string | null | undefined): Exclude<AvatarTone, 'auto' | 'solid'> {
  const text = (name ?? '').trim();
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) >>> 0;
  }
  return AUTO_TONES[hash % AUTO_TONES.length];
}

export function initialOf(name: string | null | undefined): string {
  const text = (name ?? '').trim();
  if (!text) return '?';
  const first = Array.from(text)[0];
  return first.toLocaleUpperCase('nl-NL');
}

export function Avatar({ name, size = 44, tone = 'auto', image, avatar, ring, badge, className, title }: AvatarProps) {
  const resolvedTone = tone === 'auto' ? avatarToneFor(name) : tone;
  const label = title ?? name ?? undefined;

  let face: React.ReactNode;
  if (image) {
    face = <img src={image} alt="" className="size-full rounded-full object-cover" />;
  } else if (avatar) {
    face = <MascotAvatar avatar={avatar} size={size} title={label} />;
  } else {
    face = (
      <span
        className={cn('flex size-full items-center justify-center rounded-full font-display font-semibold', TONES[resolvedTone])}
        style={{ fontSize: Math.round(size * 0.42) }}
      >
        {initialOf(name)}
      </span>
    );
  }

  return (
    <span
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn('relative inline-flex shrink-0 rounded-full overflow-visible box-border', ring && RINGS[ring], className)}
      style={{ width: size, height: size }}
    >
      <span className="block size-full rounded-full overflow-hidden">{face}</span>
      {badge && <span className="absolute left-1/2 -bottom-2.5 -translate-x-1/2">{badge}</span>}
    </span>
  );
}

/** The small numbered disc hung from a podium avatar. */
export function RankBadge({ rank, tone = 'lapis' }: { rank: number; tone?: 'gold' | 'silver' | 'bronze' | 'lapis' }) {
  const colour = { gold: 'bg-gold', silver: 'bg-silver', bronze: 'bg-bronze', lapis: 'bg-lapis' }[tone];
  return (
    <span
      aria-hidden="true"
      className={cn('flex size-6 items-center justify-center rounded-full border-2 border-card text-white text-xs font-extrabold font-sans', colour)}
    >
      {rank}
    </span>
  );
}

/** Overlapping avatars ("en 9 andere spelers"). */
export function AvatarStack({ people, size = 28, max = 4 }: { people: { name: string; image?: string | null; avatar?: AvatarConfig | null }[]; size?: number; max?: number }) {
  const shown = people.slice(0, max);
  const rest = people.length - shown.length;
  return (
    <span className="inline-flex items-center">
      {shown.map((person, index) => (
        <Avatar
          key={`${person.name}-${index}`}
          name={person.name}
          image={person.image}
          avatar={person.avatar}
          size={size}
          className={cn('ring-2 ring-card', index > 0 && '-ml-2')}
        />
      ))}
      {rest > 0 && (
        <span
          className="-ml-2 flex items-center justify-center rounded-full bg-chip text-ink-soft text-xs font-extrabold ring-2 ring-card"
          style={{ width: size, height: size }}
        >
          +{rest}
        </span>
      )}
    </span>
  );
}
