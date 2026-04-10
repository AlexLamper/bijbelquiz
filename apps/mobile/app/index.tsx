import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useAuth } from '../components/AuthProvider';

const PRIMARY_NAVY = '#121A2A';
const BG_LIGHT = '#F8FAFC';

export default function SplashScreen() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  useEffect(() => {
    // Wait for at least 2.5 seconds to show splash
    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Only navigate once min time has elapsed AND auth state is resolved
    if (minTimeElapsed && !loading) {
      if (user) {
        if (user.onboardingCompleted) {
          router.replace('/(tabs)');
        } else {
          router.replace('/onboarding/education');
        }
      } else {
        router.replace('/welcome');
      }
    }
  }, [minTimeElapsed, loading, user, router]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
            <Image 
              source={require('../assets/images/logo-dark.png')} 
              style={{ width: 48, height: 48 }}
              contentFit="contain"
            />
        </View>
        <Text style={styles.title}>BijbelQuiz</Text>
        <Text style={styles.subtitle}>
          Statenvertaling & Traditie
        </Text>
      </View>

      <View style={styles.loadingContainer}>
        <View style={[styles.dot, styles.dot1]} />
        <View style={[styles.dot, styles.dot2]} />
        <View style={[styles.dot, styles.dot3]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    zIndex: 10,
  },
  iconContainer: {
    width: 96,
    height: 96,
    backgroundColor: 'transparent',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 4,
  },
  title: {
    color: PRIMARY_NAVY,
    fontSize: 30,
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#64748B',
    marginTop: 8,
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 2,
    textTransform: 'uppercase',
    textAlign: 'center',
    paddingHorizontal: 48,
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 80,
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    backgroundColor: PRIMARY_NAVY,
    borderRadius: 4,
  },
  dot1: { },
  dot2: { },
  dot3: { },
});
