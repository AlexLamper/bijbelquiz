import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../components/AuthProvider';
import { API_BASE_URL } from '../constants/api';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { ChevronLeft } from 'lucide-react-native';
import { useGoogleAuth, handleGoogleSignIn } from '../services/googleAuth';

const PRIMARY_NAVY = '#121A2A';
const GOLD_ACCENT = '#C5A059';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const router = useRouter();
  const { onboarding } = useLocalSearchParams();
  const { signIn } = useAuth();
  const { request, response, promptAsync } = useGoogleAuth();

  const REGISTER_API_URL = `${API_BASE_URL}/api/auth/register`;
  const LOGIN_API_URL = `${API_BASE_URL}/api/auth/mobile-login`;

  // Handle Google OAuth response
  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      if (authentication?.accessToken) {
        handleGoogleRegister(authentication.accessToken);
      }
    }
  }, [response]);

  const handleGoogleRegister = async (accessToken: string) => {
    setGoogleLoading(true);
    try {
      const result = await handleGoogleSignIn(accessToken);
      
      if (result.success && result.token && result.user) {
        await signIn(result.token, result.user);
        if (onboarding) {
           router.replace('/onboarding/complete');
        } else {
           router.replace('/(tabs)');
        }
      } else {
        Alert.alert('Registreren mislukt', result.error || 'Er is iets misgegaan met Google Sign-In.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Fout', 'Kon niet registreren met Google.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Fout', 'Vul alstublieft alle velden in.');
      return;
    }

    setLoading(true);
    try {
      // 1. Register
      const response = await fetch(REGISTER_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      const text = await response.text(); 
      // Sometimes APIs return plain text on error, so safeguard parsing.
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch {
        data = { message: text };
      }

      if (response.ok) {
        // 2. Auto Login after success
        await performAutoLogin();
      } else {
        Alert.alert('Registratie mislukt', data.message || 'Controleer je gegevens.');
        setLoading(false);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Fout', 'Kon geen verbinding maken met de server.');
      setLoading(false);
    }
  };

  const performAutoLogin = async () => {
     try {
        const response = await fetch(LOGIN_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        const data = await response.json();
        
        if (response.ok && data.token) {
            await signIn(data.token, data.user);
            Alert.alert('Welkom!', 'Je bent succesvol geregistreerd.');
            
            if (onboarding) {
               router.replace('/onboarding/complete');
            } else {
               router.replace('/(tabs)');
            }
        } else {
            router.replace('/login');
        }
     } catch (e) {
         router.replace('/login');
     } finally {
         setLoading(false);
     }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]" edges={['top', 'bottom']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-8 pt-8">
          <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 mb-6 justify-center -ml-2">
            <ChevronLeft color="#9CA3AF" size={28} />
          </TouchableOpacity>

          <View className="mb-10">
            <Text className="text-3xl font-serif font-bold mb-3" style={{ color: PRIMARY_NAVY }}>Account Maken</Text>
            <Text className="text-gray-500 text-[16px]">Begin vandaag met leren en groeien!</Text>
          </View>

          <View className="space-y-4 gap-4">
             <View>
              <Text className="font-bold mb-2 ml-1 text-sm inline-block" style={{ color: PRIMARY_NAVY }}>Naam</Text>
              <TextInput
                className="bg-white border border-gray-200 rounded-2xl px-5 py-4 text-[16px]"
                style={{ color: PRIMARY_NAVY }}
                placeholder="Uw naam"
                placeholderTextColor="#9CA3AF"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View>
              <Text className="font-bold mb-2 ml-1 text-sm inline-block" style={{ color: PRIMARY_NAVY }}>E-mailadres</Text>
              <TextInput
                className="bg-white border border-gray-200 rounded-2xl px-5 py-4 text-[16px]"
                style={{ color: PRIMARY_NAVY }}
                placeholder="naam@voorbeeld.nl"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View>
              <Text className="font-bold mb-2 ml-1 text-sm inline-block" style={{ color: PRIMARY_NAVY }}>Wachtwoord</Text>
              <View className="relative">
                <TextInput
                  className="bg-white border border-gray-200 rounded-2xl px-5 py-4 text-[16px] pr-12"
                  style={{ color: PRIMARY_NAVY }}
                  placeholder="Minimaal 6 tekens"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -mt-3"
                >
                  <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={24} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity 
              className="py-4 rounded-xl items-center mt-6 shadow-sm"
              style={{ backgroundColor: PRIMARY_NAVY }}
              onPress={handleRegister}
              disabled={loading || googleLoading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-lg">Registreren</Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View className="flex-row items-center my-6">
              <View className="flex-1 h-[1px] bg-gray-200" />
              <Text className="mx-4 text-gray-400 text-sm font-bold uppercase tracking-widest">of</Text>
              <View className="flex-1 h-[1px] bg-gray-200" />
            </View>

            {/* Google Sign-In Button */}
            <TouchableOpacity 
              className="border-2 border-gray-200 bg-white py-4 rounded-xl items-center flex-row justify-center shadow-sm"
              onPress={() => promptAsync()}
              disabled={!request || loading || googleLoading}
            >
              {googleLoading ? (
                <ActivityIndicator color={PRIMARY_NAVY} />
              ) : (
                <>
                  <Image source={{ uri: 'https://img.icons8.com/color/48/000000/google-logo.png' }} style={{ width: 24, height: 24, marginRight: 12 }} />
                  <Text className="font-bold text-lg" style={{ color: PRIMARY_NAVY }}>Registreren met Google</Text>
                </>
              )}
            </TouchableOpacity>

            <View className="flex-row justify-center mt-8 pb-8">
              <Text className="text-gray-500 text-[15px]">Al een account? </Text>
              <TouchableOpacity onPress={() => router.push('/login')}>
                <Text className="font-bold text-[15px]" style={{ color: GOLD_ACCENT }}>Log in</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
