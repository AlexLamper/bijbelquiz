export const LEVELS = [
  { level: 1, title: 'Zoeker', minXp: 0, description: 'Net begonnen aan de reis.' },
  { level: 2, title: 'Lezer', minXp: 500, description: 'Begint de verhalen te leren kennen.' },
  { level: 3, title: 'Leerling', minXp: 1500, description: 'Duikt dieper in de materie.' },
  { level: 4, title: 'Kenner', minXp: 3000, description: 'Heeft een brede basiskennis.' },
  { level: 5, title: 'Onderzoeker', minXp: 5000, description: 'Begrijpt de context en verbanden.' },
  { level: 6, title: 'Geleerde', minXp: 7500, description: 'Kan lastige vragen beantwoorden.' },
  { level: 7, title: 'Schriftgeleerde', minXp: 10500, description: 'Een expert in de Schriften.' },
  { level: 8, title: 'Wijze', minXp: 14000, description: 'Deelt zijn kennis met anderen.' },
  { level: 9, title: 'Meester', minXp: 18000, description: 'Een levende bijbelencyclopedie.' },
  { level: 10, title: 'Legende', minXp: 22500, description: 'Heeft de ultieme kennis bereikt.' },
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
  { id: 'first_steps', name: 'Eerste Stappen', description: 'Voltooi je eerste quiz.', icon: 'footprints' },
  { id: 'knowledge_seeker', name: 'Kenniszoeker', description: 'Speel 10 verschillende quizzen.', icon: 'search' },
  { id: 'perfect_score', name: 'Foutloos', description: 'Haal een 100% score op een quiz.', icon: 'target' },
  { id: 'streak_3', name: 'Op Dreef', description: 'Bouw een streak van 3 dagen op.', icon: 'flame' },
  { id: 'streak_7', name: 'Toegewijd', description: 'Speel 7 dagen op rij.', icon: 'calendar-check' },
  { id: 'scholar', name: 'Geleerde', description: 'Behaal niveau 5.', icon: 'graduation-cap' },
  { id: 'master', name: 'Meester', description: 'Behaal niveau 10.', icon: 'crown' },
  { id: 'all_rounder', name: 'Allrounder', description: 'Speel een quiz in elke categorie.', icon: 'compass' },
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
