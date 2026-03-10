import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../components/AuthProvider';
import { API_BASE_URL } from '../constants/api';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { signIn } = useAuth(); // We might auto-login later if needed.

  const REGISTER_API_URL = `${API_BASE_URL}/api/auth/register`;
  const LOGIN_API_URL = `${API_BASE_URL}/api/auth/mobile-login`;

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
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-[#f8fafd]"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
        <View className="px-8 py-8">
          <View className="items-center mb-10">
            <Text className="text-4xl font-bold text-[#1a2333] font-serif">
              Account Maken
            </Text>
            <Text className="text-[#5c687e] mt-2">Begin vandaag met leren!</Text>
          </View>

          <View className="space-y-4 gap-4">
             <View>
              <Text className="text-[#5c687e] font-medium mb-1.5 ml-1">Naam</Text>
              <TextInput
                className="border border-[#e4e7f1] rounded-2xl px-4 py-4 bg-white text-[#1a2333]"
                placeholder="Je naam"
                placeholderTextColor="#94a3b8"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View>
              <Text className="text-[#5c687e] font-medium mb-1.5 ml-1">E-mailadres</Text>
              <TextInput
                className="border border-[#e4e7f1] rounded-2xl px-4 py-4 bg-white text-[#1a2333]"
                placeholder="naam@voorbeeld.nl"
                placeholderTextColor="#94a3b8"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View>
              <Text className="text-[#5c687e] font-medium mb-1.5 ml-1">Wachtwoord</Text>
              <TextInput
                className="border border-[#e4e7f1] rounded-2xl px-4 py-4 bg-white text-[#1a2333]"
                placeholder="Minimaal 6 tekens"
                placeholderTextColor="#94a3b8"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity 
              className="bg-[#232b38] py-4 rounded-[20px] items-center mt-6 shadow-lg shadow-black/10 active:opacity-80 transition-opacity"
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-[17px]">Registreren</Text>
              )}
            </TouchableOpacity>

            <View className="flex-row justify-center mt-6">
              <Text className="text-[#5c687e]">Al een account? </Text>
              <TouchableOpacity onPress={() => router.push('/login')}>
                <Text className="text-[#1a2333] font-bold">Log in</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
