import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../components/AuthProvider';
import { API_BASE_URL } from '../constants/api';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { useGoogleAuth, handleGoogleSignIn } from '../services/googleAuth';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const router = useRouter();
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
        router.replace('/(tabs)');
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
            Alert.alert('Welkom!', 'Je account is aangemaakt en je bent ingelogd.');
            router.replace('/(tabs)');
        } else {
            // Should not happen if reg was successful, but just in case
            Alert.alert('Account aangemaakt', 'Je kunt nu inloggen.');
            router.replace('/login');
        }
     } catch (e) {
         Alert.alert('Account aangemaakt', 'Je kunt nu inloggen.');
         router.replace('/login');
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
            <Text className="text-4xl font-serif font-bold text-[#1a2333] mb-3">Account Maken</Text>
            <Text className="text-[#5c687e] text-[16px]">Begin vandaag met leren en groeien!</Text>
          </View>

          <View className="space-y-4 gap-4">
             <View>
              <Text className="text-[#1a2333] font-medium mb-2 ml-1 text-sm">Naam</Text>
              <TextInput
                className="bg-white border border-[#e4e7f1] rounded-[18px] px-5 py-4 text-[#1a2333] text-[16px]"
                placeholder="Je naam"
                placeholderTextColor="#94a3b8"
                value={name}
                onChangeText={setName}
              />
            </View>

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
                  placeholder="Minimaal 6 tekens"
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
              onPress={handleRegister}
              disabled={loading || googleLoading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-[17px]">Registreren</Text>
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
                  <Text className="text-[#1a2333] font-bold text-[17px]">Registreren met Google</Text>
                </>
              )}
            </TouchableOpacity>

            <View className="flex-row justify-center mt-8">
              <Text className="text-[#5c687e] text-[15px]">Al een account? </Text>
              <TouchableOpacity onPress={() => router.push('/login')}>
                <Text className="text-[#1a2333] font-bold text-[15px]">Log in</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
