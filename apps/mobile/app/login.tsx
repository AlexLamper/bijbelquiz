import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../components/AuthProvider';
import { API_BASE_URL } from '../constants/api';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { signIn } = useAuth();
  
  const API_URL = `${API_BASE_URL}/api/auth/mobile-login`;

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Fout', 'Vul alstublieft alle velden in.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.token) {
        // Use the signIn method from context to update global state immediately
        await signIn(data.token, data.user);
        Alert.alert('Succes', 'Je bent nu ingelogd!');
        router.replace('/(tabs)');
      } else {
        Alert.alert('Inloggen mislukt', data.error || 'Controleer je gegevens.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Fout', 'Kon geen verbinding maken met de server. Controleer of de server draait.');
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
              Bijbel<Text className="text-[#547ee9] italic">Quiz</Text>
            </Text>
            <Text className="text-[#5c687e] mt-2">Log in op jouw account</Text>
          </View>

          <View className="space-y-4 gap-4">
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
                placeholder="••••••••"
                placeholderTextColor="#94a3b8"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity 
              className="bg-[#232b38] py-4 rounded-[20px] items-center mt-6 shadow-lg shadow-black/10 active:opacity-80 transition-opacity"
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-[17px]">Inloggen</Text>
              )}
            </TouchableOpacity>

            <View className="flex-row justify-center mt-6">
              <Text className="text-[#5c687e]">Heb je nog geen account? </Text>
              <TouchableOpacity onPress={() => router.push('/register')}>
                <Text className="text-[#1a2333] font-bold">Maak er een</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
