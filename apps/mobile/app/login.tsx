import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../components/AuthProvider';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { signIn } = useAuth();
  
  // Use localhost IP. 
  const API_URL = 'http://192.168.68.107:3000/api/auth/mobile-login'; 

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
      className="flex-1 bg-white dark:bg-slate-900"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
        <View className="px-8 py-8">
          <View className="items-center mb-10">
            <Text className="text-4xl font-bold text-slate-900 dark:text-white font-serif">
              Bijbel<Text className="text-primary italic">Quiz</Text>
            </Text>
            <Text className="text-slate-500 mt-2">Log in op jouw account</Text>
          </View>

          <View className="space-y-4 gap-4">
            <View>
              <Text className="text-slate-700 dark:text-slate-300 font-medium mb-1.5 ml-1">E-mailadres</Text>
              <TextInput
                className="border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3.5 bg-slate-50 dark:bg-slate-800 dark:text-white"
                placeholder="naam@voorbeeld.nl"
                placeholderTextColor="#94a3b8"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View>
              <Text className="text-slate-700 dark:text-slate-300 font-medium mb-1.5 ml-1">Wachtwoord</Text>
              <TextInput
                className="border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3.5 bg-slate-50 dark:bg-slate-800 dark:text-white"
                placeholder="••••••••"
                placeholderTextColor="#94a3b8"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity 
              className="bg-primary py-4 rounded-xl items-center mt-4 shadow-sm active:translate-y-0.5 transition-transform"
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-lg">Inloggen</Text>
              )}
            </TouchableOpacity>

            <View className="flex-row justify-center mt-6">
              <Text className="text-slate-500">Nog geen account? </Text>
              <TouchableOpacity onPress={() => router.push('/register')}>
                <Text className="text-primary font-bold">Registreer hier</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
