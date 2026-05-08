const FALLBACK_GOOGLE_CLIENT_IDS = {
  ios: '1036826851129-kqmervpgfkkjndr4egbrdm1l2gac94to.apps.googleusercontent.com',
  android: '1036826851129-ptdjlk6vc9id1s4pkl7gks9k2bghb57i.apps.googleusercontent.com',
  web: '1036826851129-29bsvr0f17j6bj4g9hsrhhbotsasp4tu.apps.googleusercontent.com',
} as const;

export type GoogleTokenPayloadLike = {
  aud?: string | string[];
  iss?: string;
  sub?: string;
  email?: string;
  email_verified?: boolean | string;
};

export function getAllowedGoogleAudiences(): string[] {
  const configured = [
    process.env.GOOGLE_CLIENT_ID_IOS,
    process.env.GOOGLE_CLIENT_ID_ANDROID,
    process.env.GOOGLE_CLIENT_ID_WEB,
  ].filter((value): value is string => Boolean(value && value.trim()));

  if (configured.length > 0) {
    return configured;
  }

  return [
    FALLBACK_GOOGLE_CLIENT_IDS.ios,
    FALLBACK_GOOGLE_CLIENT_IDS.android,
    FALLBACK_GOOGLE_CLIENT_IDS.web,
  ];
}

export function getPrimaryAudience(payload: GoogleTokenPayloadLike): string | undefined {
  if (Array.isArray(payload.aud)) {
    return payload.aud[0];
  }
  return payload.aud;
}

export function isGoogleIssuerValid(issuer: string | undefined): boolean {
  return issuer === 'accounts.google.com' || issuer === 'https://accounts.google.com';
}

export function isGoogleAudienceValid(
  tokenAudience: string | string[] | undefined,
  allowedAudiences: string[],
): boolean {
  if (!tokenAudience) {
    return false;
  }

  if (Array.isArray(tokenAudience)) {
    return tokenAudience.some((aud) => allowedAudiences.includes(aud));
  }

  return allowedAudiences.includes(tokenAudience);
}

export function isGoogleEmailVerified(emailVerified: boolean | string | undefined): boolean {
  return emailVerified === true || emailVerified === 'true';
}
