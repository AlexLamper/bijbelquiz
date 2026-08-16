export type ThemePreference = 'light' | 'dark' | 'system';
export type PreferredDifficulty = 'all' | 'easy' | 'medium' | 'hard';
export type QuestionFontSize = 'normal' | 'large';

/**
 * Every field here is read by something. Settings that nothing consumes were
 * removed rather than left as switches that silently do nothing — if a feature
 * needs a new preference, add the field and its reader in the same change.
 */
export interface UserSettings {
  /** Applied on load by `ThemeSync`, so the choice follows the account. */
  themePreference: ThemePreference;
  /** Gates the verse block under a quiz explanation in `QuizPlayer`. */
  showBibleReferences: boolean;
  /** Pre-selects the difficulty filter on the quiz overview. */
  preferredDifficulty: PreferredDifficulty;
  /** Seeds the question text size in `QuizPlayer`, which writes changes back. */
  questionFontSize: QuestionFontSize;
}

export interface UserOnboardingSettings {
  bibleReadingFrequency: string;
  knowledgeLevel: string;
  interests: string[];
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
  themePreference: 'light',
  showBibleReferences: true,
  preferredDifficulty: 'all',
  questionFontSize: 'normal',
};

export const DEFAULT_ONBOARDING_SETTINGS: UserOnboardingSettings = {
  bibleReadingFrequency: '',
  knowledgeLevel: '',
  interests: [],
};

const THEME_PREFERENCES: ThemePreference[] = ['light', 'dark', 'system'];
const PREFERRED_DIFFICULTIES: PreferredDifficulty[] = ['all', 'easy', 'medium', 'hard'];
const QUESTION_FONT_SIZES: QuestionFontSize[] = ['normal', 'large'];

function pick<T extends string>(allowed: T[], value: unknown, fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

/**
 * Coerce whatever is on the user document into a complete, valid settings
 * object. Documents written before a field existed — or before it was dropped
 * and re-added — must never surface an out-of-range value to the UI, because a
 * `Select` with an unknown value renders blank.
 */
export function normalizeUserSettings(
  settings: Partial<UserSettings> | null | undefined
): UserSettings {
  return {
    themePreference: pick(
      THEME_PREFERENCES,
      settings?.themePreference,
      DEFAULT_USER_SETTINGS.themePreference
    ),
    showBibleReferences:
      typeof settings?.showBibleReferences === 'boolean'
        ? settings.showBibleReferences
        : DEFAULT_USER_SETTINGS.showBibleReferences,
    preferredDifficulty: pick(
      PREFERRED_DIFFICULTIES,
      settings?.preferredDifficulty,
      DEFAULT_USER_SETTINGS.preferredDifficulty
    ),
    questionFontSize: pick(
      QUESTION_FONT_SIZES,
      settings?.questionFontSize,
      DEFAULT_USER_SETTINGS.questionFontSize
    ),
  };
}

export function normalizeOnboardingSettings(
  onboarding: Partial<UserOnboardingSettings> | null | undefined
): UserOnboardingSettings {
  return {
    ...DEFAULT_ONBOARDING_SETTINGS,
    ...onboarding,
    interests: Array.isArray(onboarding?.interests) ? onboarding.interests.filter(Boolean) : [],
  };
}

/**
 * Quiz documents use two vocabularies for the same three levels: authoring
 * screens write `easy|medium|hard`, older seeds write `beginner|intermediate|
 * advanced`. The difficulty filter has to match both.
 */
export function matchesPreferredDifficulty(
  preference: PreferredDifficulty,
  quizDifficulty: string | undefined
): boolean {
  if (preference === 'all') return true;

  const key = (quizDifficulty || '').toLowerCase();

  if (preference === 'easy') return key === 'easy' || key === 'beginner';
  if (preference === 'medium') return key === 'medium' || key === 'intermediate';
  return key === 'hard' || key === 'advanced';
}
