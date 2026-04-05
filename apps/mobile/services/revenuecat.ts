import { Platform } from 'react-native';
import Purchases from 'react-native-purchases';

let isConfigured = false;

function getRevenueCatApiKey() {
  if (Platform.OS === 'ios') {
    return process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS;
  }
  if (Platform.OS === 'android') {
    return process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID;
  }
  return undefined;
}

export async function initRevenueCat(userId?: string) {
  const apiKey = getRevenueCatApiKey();
  if (!apiKey) {
    return false;
  }

  try {
    if (!isConfigured) {
      await Purchases.configure({ apiKey, appUserID: userId });
      isConfigured = true;
      return true;
    }

    if (userId) {
      await Purchases.logIn(userId);
    }

    return true;
  } catch (error) {
    console.warn('[RevenueCat] init skipped:', error);
    return false;
  }
}

export async function logoutRevenueCat() {
  try {
    await Purchases.logOut();
  } catch (error) {
    console.warn('[RevenueCat] logout skipped:', error);
  }
}
