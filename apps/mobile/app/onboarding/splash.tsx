import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ImageBackground, Animated } from 'react-native';
import { useRouter } from 'expo-router';
// Note: You may want to install `@expo/vector-icons` if not already present or use an alternative icon.
import { BookOpen } from 'lucide-react-native';

const PRIMARY_NAVY = '#121A2A';
const GOLD_ACCENT = '#C5A059';

export default function SplashScreen() {
  const router = useRouter();
  
  // Example animation values for bouncing dots
  const dot1Y = new Animated.Value(0);
  const dot2Y = new Animated.Value(0);
  const dot3Y = new Animated.Value(0);

  useEffect(() => {
    // Navigate naturally after splash
    const timer = setTimeout(() => {
        router.push('/onboarding/education');
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <ImageBackground
        source={{ uri: 'https://media.screensdesign.com/gasset/c1b20645-c1c9-486d-af7e-7b04665a8f6c.png' }}
        style={styles.backgroundImage}
        imageStyle={{ opacity: 0.2 }}
      >
        <View style={styles.content}>
          <View style={styles.iconContainer}>
             <BookOpen color="white" size={48} />
          </View>
          <Text style={styles.title}>Bijbelquiz</Text>
          <Text style={styles.subtitle}>
            Statenvertaling & Traditie
          </Text>
        </View>

        <View style={styles.loadingContainer}>
          <View style={[styles.dot, styles.dot1]} />
          <View style={[styles.dot, styles.dot2]} />
          <View style={[styles.dot, styles.dot3]} />
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PRIMARY_NAVY,
  },
  backgroundImage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  content: {
    alignItems: 'center',
    zIndex: 10,
  },
  iconContainer: {
    width: 96,
    height: 96,
    backgroundColor: GOLD_ACCENT,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    color: 'white',
    fontSize: 30,
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontWeight: 'bold',
    // fontFamily: 'serif' - add custom font mapping here.
  },
  subtitle: {
    color: GOLD_ACCENT,
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
    backgroundColor: GOLD_ACCENT,
    borderRadius: 4,
  },
  dot1: { /* Add animation keys if using standard React Native Animated */ },
  dot2: { },
  dot3: { },
});
