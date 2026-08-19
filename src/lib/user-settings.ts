export type ThemePreference = 'light' | 'dark' | 'system';
export type PreferredDifficulty = 'all' | 'easy' | 'medium' | 'hard';
export type QuestionFontSize = 'normal' | 'large';

/**
 * Seconds allowed per question. `0` means no timer at all - the default,
 * because a countdown on a Bible study quiz creates pressure that the product
 * does not otherwise ask for. It exists for readers who want it.
 */
export const QUESTION_TIMER_CHOICES = [0, 30, 60, 90] as const;
export type QuestionTimerSeconds = (typeof QUESTION_TIMER_CHOICES)[number];

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
  /** Countdown per question; `0` switches the timer off entirely. */
  questionTimerSeconds: QuestionTimerSeconds;
  /**
   * Open the Bible chapter a quiz is about before the first question.
   *
   * Turns a quiz from a memory test into a reading exercise: read Daniël 2,
   * then answer about Daniël 2. Set from the quiz start screen, remembered
   * afterwards so it does not have to be chosen every time.
   */
  readPassageFirst: boolean;
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
  questionTimerSeconds: 0,
  readPassageFirst: false,
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
 * What a settings object looks like before it has been normalised.
 *
 * Every field is loose on purpose: this is what comes off a Mongoose document
 * or a JSON body, where the timer is any `number` and a field written by an
 * older build may be missing or of the wrong shape entirely.
 */
export type RawUserSettings = {
  [K in keyof UserSettings]?: K extends 'questionTimerSeconds' ? number : UserSettings[K];
};

/**
 * Coerce whatever is on the user document into a complete, valid settings
 * object. Documents written before a field existed — or before it was dropped
 * and re-added — must never surface an out-of-range value to the UI, because a
 * `Select` with an unknown value renders blank.
 */
export function normalizeUserSettings(
  settings: RawUserSettings | null | undefined
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
    questionTimerSeconds: normalizeQuestionTimer(settings?.questionTimerSeconds),
    readPassageFirst:
      typeof settings?.readPassageFirst === 'boolean'
        ? settings.readPassageFirst
        : DEFAULT_USER_SETTINGS.readPassageFirst,
  };
}

/**
 * Coerce a stored timer value onto the offered choices.
 *
 * An out-of-range number would render a countdown nobody selected, so anything
 * unrecognised falls back to "off" rather than to the nearest option.
 */
export function normalizeQuestionTimer(value: unknown): QuestionTimerSeconds {
  const parsed = typeof value === 'number' ? value : Number.parseInt(String(value ?? ''), 10);
  return (QUESTION_TIMER_CHOICES as readonly number[]).includes(parsed)
    ? (parsed as QuestionTimerSeconds)
    : 0;
}

/** "30 seconden per vraag" / "Geen tijdslimiet". */
export function formatQuestionTimer(seconds: QuestionTimerSeconds): string {
  return seconds === 0 ? 'Geen tijdslimiet' : `${seconds} seconden per vraag`;
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
