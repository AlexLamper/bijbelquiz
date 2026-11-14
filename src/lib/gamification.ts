import { t } from '@/i18n';

export const LEVELS = [
  { level: 1, title: t('lib.level.1.title'), minXp: 0, description: t('lib.level.1.desc') },
  { level: 2, title: t('lib.level.2.title'), minXp: 500, description: t('lib.level.2.desc') },
  { level: 3, title: t('lib.level.3.title'), minXp: 1500, description: t('lib.level.3.desc') },
  { level: 4, title: t('lib.level.4.title'), minXp: 3000, description: t('lib.level.4.desc') },
  { level: 5, title: t('lib.level.5.title'), minXp: 5000, description: t('lib.level.5.desc') },
  { level: 6, title: t('lib.scholar'), minXp: 7500, description: t('lib.level.6.desc') },
  { level: 7, title: t('lib.level.7.title'), minXp: 10500, description: t('lib.level.7.desc') },
  { level: 8, title: t('lib.level.8.title'), minXp: 14000, description: t('lib.level.8.desc') },
  { level: 9, title: t('lib.master'), minXp: 18000, description: t('lib.level.9.desc') },
  { level: 10, title: t('lib.level.10.title'), minXp: 22500, description: t('lib.level.10.desc') },
];

/**
 * The badge catalogue.
 *
 * `icon` is a semantic name, not a glyph. Emoji rendered as the badge art put a
 * different typeface - and a different visual era - next to every piece of
 * editorial type on the profile page, and they render differently on every
 * platform. Each client maps the name onto its own icon set instead: the
 * website onto Lucide, the Flutter app onto Material icons.
 */
export const BADGES = [
  { id: 'first_steps', name: t('lib.badge.firstSteps'), description: t('lib.badge.firstStepsDesc'), icon: 'footprints' },
  { id: 'knowledge_seeker', name: t('lib.badge.seeker'), description: t('lib.badge.seekerDesc'), icon: 'search' },
  { id: 'perfect_score', name: t('lib.flawless'), description: t('lib.badge.perfectDesc'), icon: 'target' },
  { id: 'streak_3', name: t('lib.badge.streak3'), description: t('lib.badge.streak3Desc'), icon: 'flame' },
  { id: 'streak_7', name: t('lib.badge.streak7'), description: t('lib.badge.streak7Desc'), icon: 'calendar-check' },
  { id: 'scholar', name: t('lib.scholar'), description: t('lib.badge.scholarDesc'), icon: 'graduation-cap' },
  { id: 'master', name: t('lib.master'), description: t('lib.badge.masterDesc'), icon: 'crown' },
  { id: 'all_rounder', name: t('lib.badge.allRounder'), description: t('lib.badge.allRounderDesc'), icon: 'compass' },
] as const;

export type BadgeIconName = (typeof BADGES)[number]['icon'];

export function getLevelInfo(xp: number) {
  let currentLevelIndex = 0;

  for (let i = 0; i < LEVELS.length; i++) {
    if (xp >= LEVELS[i].minXp) {
      currentLevelIndex = i;
    } else {
      break;
    }
  }

  const currentLevel = LEVELS[currentLevelIndex];
  const nextLevel = LEVELS[currentLevelIndex + 1] || null;

  const currentLevelXp = currentLevel.minXp;
  const nextLevelXp = nextLevel ? nextLevel.minXp : currentLevelXp + 5000;
  
  const xpIntoCurrentLevel = xp - currentLevelXp;
  const xpRequiredForNextLevel = nextLevelXp - currentLevelXp;
  
  const progressPercentage = nextLevel 
    ? Math.round((xpIntoCurrentLevel / xpRequiredForNextLevel) * 100) 
    : 100;

  return {
    level: currentLevel.level,
    title: currentLevel.title,
    currentXp: xp,
    minXp: currentLevelXp,
    nextLevelXp,
    progressPercentage: Math.max(0, Math.min(100, progressPercentage)),
    isMaxLevel: !nextLevel,
  };
}
