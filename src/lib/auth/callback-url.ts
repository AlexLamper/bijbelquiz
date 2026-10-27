/**
 * Where to go after signing in. Only a path on this site: `?callbackUrl=`
 * comes from the address bar, and an absolute or protocol-relative URL there
 * would turn the login form into an open redirect.
 */
export const DEFAULT_AFTER_LOGIN = '/dashboard';

export function safeCallbackUrl(raw: string | null | undefined, fallback = DEFAULT_AFTER_LOGIN): string {
  if (!raw) return fallback;
  const value = raw.trim();
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return fallback;
  // The auth pages themselves are no destination.
  if (/^\/(inloggen|registreren|wachtwoord-vergeten|wachtwoord-herstellen)(\/|\?|$)/.test(value)) return fallback;
  return value;
}
