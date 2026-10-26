import * as React from 'react';

import scenes from '@/lib/quiz-scenes.json';
import { cn } from '@/lib/utils';

/**
 * The quiz cover scenes: light-palette silhouette illustrations on a
 * 280x158 canvas, from the approved designs (`docs/web-2/quiz-scenes.json`).
 *
 * A quiz whose title has a scene of its own gets that scene. Every other quiz
 * gets a generic landscape in one of the four palettes, picked from the
 * `seed` (the slug, so the choice is stable), so a grid never shows a blank
 * cover and never shows the same scene next to itself by accident.
 */
const SCENES = scenes as Record<string, string>;

const OPEN_TAG = /^<svg[^>]*>/;
const CLOSE_TAG = /<\/svg>\s*$/;

function innerOf(svg: string): string {
  return svg.replace(OPEN_TAG, '').replace(CLOSE_TAG, '');
}

export const SCENE_TITLES = Object.keys(SCENES);

export function hasScene(title: string | null | undefined): boolean {
  return Boolean(title && SCENES[title]);
}

interface Palette {
  sky: string;
  far: string;
  near: string;
  sun: string;
  figure: string;
}

const PALETTES: Palette[] = [
  { sky: '#DCE5F3', far: '#AFC0DD', near: '#8FA6CC', sun: '#FFFFFF', figure: '#2E3B57' },
  { sky: '#F8ECE6', far: '#E3BCA9', near: '#D4A58D', sun: '#FFFFFF', figure: '#6E3420' },
  { sky: '#E9F0EA', far: '#B9CFBE', near: '#9DBBA3', sun: '#FFFFFF', figure: '#2E5A3E' },
  { sky: '#FBF1D6', far: '#EBD9A4', near: '#D9C07A', sun: '#FFFFFF', figure: '#5A4418' },
];

function hashOf(text: string): number {
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) >>> 0;
  }
  return hash;
}

/** A hills-and-sun scene, deterministic per seed. */
function fallbackScene(seed: string): string {
  const hash = hashOf(seed);
  const palette = PALETTES[hash % PALETTES.length];
  const sunX = 190 + (hash % 50);
  const lift = (hash >> 4) % 14;
  return [
    `<rect width="280" height="158" fill="${palette.sky}"></rect>`,
    `<circle cx="${sunX}" cy="${40 + (hash % 10)}" r="${16 + (hash % 6)}" fill="${palette.sun}" opacity="0.85"></circle>`,
    `<path d="M0 158 V${96 + lift} Q70 ${66 + lift} 150 ${92 + lift} T280 ${80 + lift} V158 Z" fill="${palette.far}"></path>`,
    `<path d="M0 158 V${118 + lift} Q90 ${100 + lift} 170 ${120 + lift} T280 ${112 + lift} V158 Z" fill="${palette.near}"></path>`,
    `<path d="M${132 + (hash % 20)} 110 q3 -5 6 0 l3 24 h-12 z" fill="${palette.figure}"></path>`,
    `<circle cx="${135 + (hash % 20)}" cy="106" r="4" fill="${palette.figure}"></circle>`,
  ].join('');
}

export interface QuizSceneProps {
  /** The quiz title; matched exactly against the scene catalogue. */
  title?: string | null;
  /** Stable seed for the fallback scene, normally the slug. */
  seed?: string;
  className?: string;
  /** Rounded corners are the parent's job; this fills whatever box it is in. */
  style?: React.CSSProperties;
}

export function QuizScene({ title, seed, className, style }: QuizSceneProps) {
  const own = title ? SCENES[title] : undefined;
  const inner = own ? innerOf(own) : fallbackScene(seed ?? title ?? '');
  return (
    <svg
      viewBox="0 0 280 158"
      preserveAspectRatio="xMidYMid slice"
      width="100%"
      height="100%"
      aria-hidden="true"
      className={cn('block', className)}
      style={style}
      dangerouslySetInnerHTML={{ __html: inner }}
    />
  );
}
