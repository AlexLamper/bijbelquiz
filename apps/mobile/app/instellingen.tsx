import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { useAuth } from '../components/AuthProvider';
import { API_BASE_URL } from '../constants/api';
import * as SecureStore from 'expo-secure-store';

export default function InstellingenScreen() {
  const router = useRouter();
  const { user, signIn } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Fout', 'Naam mag niet leeg zijn.');
      return;
    }
    
    setIsSaving(true);
    try {
      const token = await SecureStore.getItemAsync('userToken');
      const res = await fetch(`${API_BASE_URL}/api/user/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name })
      });
      
      if (res.ok) {
        const data = await res.json();
        // Update the context with the refreshed user data
        if (data.user && token) {
          await signIn(token, data.user);
        }
        Alert.alert('Succes', 'Profiel bijgewerkt!');
        router.back();
      } else {
        const data = await res.json();
        Alert.alert('Fout', data.error || 'Er ging iets mis bij het bijwerken.');
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Fout', 'Kon geen verbinding maken met de server.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-row items-center px-4 py-3 border-b border-gray-200 bg-white">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <Ionicons name="arrow-back" size={24} color="#121A2A" />
        </TouchableOpacity>
        <Text className="flex-1 text-center font-bold text-[#121A2A] text-lg mr-8">Instellingen</Text>
      </View>

      <ScrollView className="flex-1 px-6 py-6">
        <View className="mb-6">
          <Text className="text-[#121A2A] font-bold text-base mb-2">Weergavenaam</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-[#121A2A]"
            placeholder="Jouw naam"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <TouchableOpacity 
          className="bg-[#121A2A] rounded-xl py-4 items-center mb-6"
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-[16px]">Opslaan</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
