/**
 * Platform and sign-up method keys with their Dutch labels. No server
 * imports, so client components can use them. See `platform.ts`.
 */

/** What is stored. */
export type SignupPlatform = 'web-desktop' | 'web-mobile' | 'ios' | 'android';
export const SIGNUP_PLATFORMS: readonly SignupPlatform[] = ['web-desktop', 'web-mobile', 'ios', 'android'];

/** What is reported: the stored values plus the less precise derived ones. */
export type PlatformKey = SignupPlatform | 'web' | 'app' | 'onbekend';
export const PLATFORM_KEYS: readonly PlatformKey[] = ['web-desktop', 'web-mobile', 'web', 'ios', 'android', 'app', 'onbekend'];

export const PLATFORM_LABELS: Record<PlatformKey, string> = {
  'web-desktop': 'Website (computer)',
  'web-mobile': 'Website (mobiel)',
  web: 'Website',
  ios: 'iOS-app',
  android: 'Android-app',
  app: 'App',
  onbekend: 'Onbekend',
};

export type SignupMethod = 'email' | 'google' | 'apple';
export type MethodKey = SignupMethod | 'onbekend';
export const METHOD_KEYS: readonly MethodKey[] = ['email', 'google', 'apple', 'onbekend'];

export const METHOD_LABELS: Record<MethodKey, string> = {
  email: 'E-mail',
  google: 'Google',
  apple: 'Apple',
  onbekend: 'Onbekend',
};

export function isPlatformKey(value: unknown): value is PlatformKey {
  return typeof value === 'string' && (PLATFORM_KEYS as readonly string[]).includes(value);
}

export function isSignupPlatform(value: unknown): value is SignupPlatform {
  return typeof value === 'string' && (SIGNUP_PLATFORMS as readonly string[]).includes(value);
}
