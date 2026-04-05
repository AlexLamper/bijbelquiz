import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../components/AuthProvider';
import { API_BASE_URL } from '../constants/api';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { useGoogleAuth, handleGoogleSignIn } from '../services/googleAuth';
import * as AuthSession from 'expo-auth-session';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const router = useRouter();
  const { signIn } = useAuth();
  const { request, response, promptAsync } = useGoogleAuth();
  
  const API_URL = `${API_BASE_URL}/api/auth/mobile-login`;

  // Handle Google OAuth response
  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      if (authentication?.accessToken) {
        handleGoogleLogin(authentication.accessToken);
      }
    }
  }, [response]);

  const handleGoogleLogin = async (accessToken: string) => {
    setGoogleLoading(true);
    console.log('[DEBUG_AUTH] Starting handleGoogleLogin with token');
    try {
      const result = await handleGoogleSignIn(accessToken);
      console.log('[DEBUG_AUTH] handleGoogleSignIn result:', result);
      
      if (result.success && result.token && result.user) {
        await signIn(result.token, result.user);
        router.replace('/(tabs)');
      } else {
        console.error('[DEBUG_AUTH] Google Sign-In failure from backend:', result.error);
        Alert.alert('Inloggen mislukt', result.error || 'Er is iets misgegaan met Google Sign-In.');
      }
    } catch (error) {
      console.error('[DEBUG_AUTH] Google Sign-In hard crash:', error);
      Alert.alert('Fout', 'Kon niet inloggen met Google.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Fout', 'Vul alstublieft alle velden in.');
      return;
    }

    setLoading(true);
    console.log(`[DEBUG_AUTH] Attempting standard login to API: ${API_URL}`);
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      console.log(`[DEBUG_AUTH] Standard login response status: ${response.status}`);
      const data = await response.json();
      console.log(`[DEBUG_AUTH] Standard login response data:`, data);

      if (response.ok && data.token) {
        await signIn(data.token, data.user);
        router.replace('/(tabs)');
      } else {
        Alert.alert('Inloggen mislukt', data.error || 'Controleer je gegevens.');
      }
    } catch (error) {
      console.error('[DEBUG_AUTH] Standard login network crash:', error);
      Alert.alert('Fout', `Netwerkfout. URL was: ${API_URL}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f8fafd]" edges={['top', 'bottom']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-8 pt-8">
          <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 mb-6 justify-center">
            <Ionicons name="arrow-back" size={24} color="#1a2333" />
          </TouchableOpacity>

          <View className="mb-10">
            <Text className="text-4xl font-serif font-bold text-[#1a2333] mb-3">Welkom terug.</Text>
            <Text className="text-[#5c687e] text-[16px]">Log in om verder te gaan met je bijbelreis.</Text>
          </View>

          <View className="space-y-4 gap-4">
            <View>
              <Text className="text-[#1a2333] font-medium mb-2 ml-1 text-sm">E-mailadres</Text>
              <TextInput
                className="bg-white border border-[#e4e7f1] rounded-[18px] px-5 py-4 text-[#1a2333] text-[16px]"
                placeholder="naam@voorbeeld.nl"
                placeholderTextColor="#94a3b8"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View>
              <Text className="text-[#1a2333] font-medium mb-2 ml-1 text-sm">Wachtwoord</Text>
              <View className="relative">
                <TextInput
                  className="bg-white border border-[#e4e7f1] rounded-[18px] px-5 py-4 text-[#1a2333] text-[16px] pr-12"
                  placeholder="Je wachtwoord"
                  placeholderTextColor="#94a3b8"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -mt-3"
                >
                  <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={24} color="#5c687e" />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity 
              className="bg-[#547ee9] py-[18px] rounded-[18px] items-center mt-6 shadow-sm"
              onPress={handleLogin}
              disabled={loading || googleLoading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-[17px]">Inloggen</Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View className="flex-row items-center my-6">
              <View className="flex-1 h-[1px] bg-[#e4e7f1]" />
              <Text className="mx-4 text-[#8e94a8] text-[14px]">of</Text>
              <View className="flex-1 h-[1px] bg-[#e4e7f1]" />
            </View>

            {/* Google Sign-In Button */}
            <TouchableOpacity 
              className="border-[1.5px] border-[#e4e7f1] bg-white py-[18px] rounded-[18px] items-center flex-row justify-center shadow-sm"
              onPress={() => promptAsync()}
              disabled={!request || loading || googleLoading}
            >
              {googleLoading ? (
                <ActivityIndicator color="#1a2333" />
              ) : (
                <>
                  <FontAwesome name="google" size={20} color="#DB4437" style={{ marginRight: 12 }} />
                  <Text className="text-[#1a2333] font-bold text-[17px]">Inloggen met Google</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View className="flex-row justify-center mt-8">
            <Text className="text-[#5c687e] text-[15px]">Nog geen account? </Text>
            <TouchableOpacity onPress={() => router.push('/register')}>
              <Text className="text-[#1a2333] font-bold text-[15px]">Maak er een</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}


