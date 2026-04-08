import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../constants/api';

// This is required for the Google sign-in to work
WebBrowser.maybeCompleteAuthSession();

// Google OAuth credentials
const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;

export const useGoogleAuth = () => {
  if (!WEB_CLIENT_ID || !IOS_CLIENT_ID || !ANDROID_CLIENT_ID) {
    throw new Error('Missing Google OAuth client IDs. Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID, EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID, and EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID.');
  }

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: WEB_CLIENT_ID,
    webClientId: WEB_CLIENT_ID,
    iosClientId: IOS_CLIENT_ID,
    androidClientId: ANDROID_CLIENT_ID,
    // Provide no custom redirectUri to let `expo-auth-session` 
    // automatically map it to com.bijbelquiz.app:/oauth2redirect/google on Android
  });

  return { request, response, promptAsync };
};

export const handleGoogleSignIn = async (accessToken: string) => {
  try {
    console.log('[DEBUG_AUTH] Fetching Google user info...');
    // Get user info from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userInfoResponse.ok) {
      console.error('[DEBUG_AUTH] Google user info fetch bad status:', userInfoResponse.status);
      throw new Error('Failed to fetch user info from Google');
    }

    const googleUser = await userInfoResponse.json();
    console.log(`[DEBUG_AUTH] Got Google profile for ${googleUser.email}, sending to backend API: ${API_BASE_URL}/api/auth/google-mobile`);

    // Send to backend for authentication
    const response = await fetch(`${API_BASE_URL}/api/auth/google-mobile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: googleUser.email,
        name: googleUser.name,
        image: googleUser.picture,
        googleId: googleUser.id,
      }),
    });

    console.log('[DEBUG_AUTH] Backend response status:', response.status);
    if (!response.ok) {
      const errorData = await response.json();
      console.error('[DEBUG_AUTH] Backend auth failed:', errorData);
      throw new Error(errorData.error || 'Google sign-in failed');
    }

    const data = await response.json();
    console.log('[DEBUG_AUTH] Backend login successful!');

    // Store the JWT token
    if (data.token) {
      await SecureStore.setItemAsync('userToken', data.token);
    }

    return {
      success: true,
      token: data.token,
      user: data.user,
    };
  } catch (error) {
    console.error('Google sign-in error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Google sign-in failed',
    };
  }
};
