export type ThemePreference = 'light' | 'dark' | 'system';
export type PreferredDifficulty = 'all' | 'easy' | 'medium' | 'hard';
export type QuestionFontSize = 'normal' | 'large';

export interface UserSettings {
  themePreference: ThemePreference;
  emailNotifications: boolean;
  soundEffects: boolean;
  showBibleReferences: boolean;
  dailyReminder: boolean;
  preferredDifficulty: PreferredDifficulty;
  questionFontSize: QuestionFontSize;
}

export interface UserOnboardingSettings {
  bibleReadingFrequency: string;
  knowledgeLevel: string;
  interests: string[];
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
  themePreference: 'light',
  emailNotifications: true,
  soundEffects: true,
  showBibleReferences: true,
  dailyReminder: false,
  preferredDifficulty: 'all',
  questionFontSize: 'normal',
};

export const DEFAULT_ONBOARDING_SETTINGS: UserOnboardingSettings = {
  bibleReadingFrequency: '',
  knowledgeLevel: '',
  interests: [],
};

export function normalizeUserSettings(settings: Partial<UserSettings> | null | undefined): UserSettings {
  return {
    ...DEFAULT_USER_SETTINGS,
    ...settings,
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
