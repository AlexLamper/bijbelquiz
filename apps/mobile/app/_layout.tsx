import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import '../global.css';

import { useColorScheme } from '@/components/useColorScheme';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: 'index',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

import { AuthProvider } from '../components/AuthProvider';

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false, gestureEnabled: false }} />       
          <Stack.Screen name="onboarding/splash" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding/education" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding/quiz_bible_usage" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding/quiz_knowledge_level" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding/quiz_topics_interest" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding/quiz_reminder_time" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding/educational_impact" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding/complete" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding/paywall" options={{ headerShown: false, presentation: 'modal' }} />
          <Stack.Screen name="onboarding/paywall_trial" options={{ headerShown: false, presentation: 'modal' }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
          <Stack.Screen name="quiz/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="instellingen" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false, gestureEnabled: false }} />        
          <Stack.Screen name="register" options={{ headerShown: false, gestureEnabled: false }} />     
        </Stack>
      </ThemeProvider>
    </AuthProvider>
  );
}
