import Constants from 'expo-constants';

const fromExtra = (Constants.expoConfig?.extra as { apiBaseUrl?: string } | undefined)?.apiBaseUrl;
const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL;
const hostFromExpo =
	Constants.expoGoConfig?.debuggerHost?.split(':')[0] ||
	Constants.expoConfig?.hostUri?.split(':')[0];

const autoDetected = hostFromExpo ? `http://${hostFromExpo}:3000` : undefined;

export const API_BASE_URL = fromEnv || autoDetected || fromExtra || 'http://localhost:3000';

console.log('[DEBUG_API_URL] fromExtra:', fromExtra);
console.log('[DEBUG_API_URL] fromEnv:', fromEnv);
console.log('[DEBUG_API_URL] hostFromExpo:', hostFromExpo);
console.log('[DEBUG_API_URL] autoDetected:', autoDetected);
console.log('[DEBUG_API_URL] FINAL API_BASE_URL:', API_BASE_URL);
