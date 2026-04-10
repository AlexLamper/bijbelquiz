import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../components/AuthProvider';
import { API_BASE_URL } from '../constants/api';
import * as SecureStore from 'expo-secure-store';

const PRIMARY_NAVY = '#121A2A';
const GOLD_ACCENT = '#C5A059';

const FREQUENCY_OPTIONS = ['Dagelijks', 'Wekelijks', 'Af en toe'];
const LEVEL_OPTIONS = [
  { id: 'beginner', label: 'Beginner' },
  { id: 'intermediate', label: 'Gevorderd' },
  { id: 'expert', label: 'Expert' }
];

const TOPICS = [
  { id: 'prophets', label: 'Profeten' },
  { id: 'kings', label: 'Koningen' },
  { id: 'parables', label: 'Gelijkenissen' },
  { id: 'miracles', label: 'Wonderen' },
  { id: 'creation', label: 'Schepping' },
  { id: 'apostles', label: 'Apostelen' },
];

export default function InstellingenScreen() {
  const router = useRouter();
  const { user, signIn } = useAuth();
  
  const [name, setName] = useState(user?.name || '');
  const [readingFrequency, setReadingFrequency] = useState(user?.onboarding?.bibleReadingFrequency || '');
  const [knowledgeLevel, setKnowledgeLevel] = useState(user?.onboarding?.knowledgeLevel || '');
  const [interests, setInterests] = useState<string[]>(user?.onboarding?.interests || []);
  
  const [isSaving, setIsSaving] = useState(false);

  const toggleInterest = (id: string) => {
    setInterests(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Fout', 'Naam mag niet leeg zijn.');
      return;
    }
    
    setIsSaving(true);
    try {
      const token = await SecureStore.getItemAsync('userToken');
      if (!token) throw new Error('Geen token gevonden');

      // 1. Update Name
      const nameRes = await fetch(`${API_BASE_URL}/api/user/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name })
      });
      
      let nameData: any = {}; try { nameData = await nameRes.json(); } catch(e) { console.error('Failed to parse nameRes.'); }
      if (!nameRes.ok) {
        Alert.alert('Fout bij naam', nameData.error || 'Er ging iets mis bij het updaten van je naam.');
        setIsSaving(false);
        return;
      }

      // 2. Update Onboarding Settings
      const obsRes = await fetch(`${API_BASE_URL}/api/user/onboarding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          bibleReadingFrequency: readingFrequency,
          knowledgeLevel: knowledgeLevel,
          interests: interests
        })
      });

      if (!obsRes.ok) {
        Alert.alert('Fout bij voorkeuren', 'Er ging iets mis bij het updaten van je voorkeuren.');
        setIsSaving(false);
        return;
      }
      
      let obsData: any = {}; try { obsData = await obsRes.json(); } catch(e) { console.error('Failed to parse obsRes.'); }

      // Ensure local state represents both updates
      const updatedUser = {
        ...nameData.user,
        onboarding: obsData.onboarding
      };

      await signIn(token, updatedUser);

      Alert.alert('Succes', 'Profiel en voorkeuren bijgewerkt!');
      router.back();
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
          <Ionicons name="arrow-back" size={24} color={PRIMARY_NAVY} />
        </TouchableOpacity>
        <Text className="flex-1 text-center font-bold text-lg mr-8" style={{ color: PRIMARY_NAVY }}>Instellingen</Text>
      </View>

      <ScrollView className="flex-1 px-6 py-6" contentContainerStyle={{ paddingBottom: 60 }}>
        
        {/* WEERGAVENAAM */}
        <View className="mb-4">
          <Text className="text-gray-700 font-bold mb-2">Weergavenaam</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            className="bg-white border border-gray-200 rounded-xl px-4 py-3"
            style={{ color: PRIMARY_NAVY }}
            placeholder="Jouw naam"
            placeholderTextColor="#9CA3AF"
          />
          <Text className="text-xs text-gray-500 mt-2 ml-1">Je naam kan eens per 30 dagen worden aangepast.</Text>
        </View>

        {/* VOORKEUREN */}
        <View className="mb-4 mt-4">
          <Text className="font-bold text-lg mb-4" style={{ color: PRIMARY_NAVY }}>Voorkeuren</Text>

          {/* Leesfrequentie */}
          <Text className="text-gray-700 font-semibold mb-3">Leesfrequentie bijbel</Text>
          <View className="flex-row flex-wrap mb-4">
            {FREQUENCY_OPTIONS.map(opt => {
              const isSelected = readingFrequency === opt;
              return (
                <TouchableOpacity
                  key={opt}
                  onPress={() => setReadingFrequency(opt)}
                  style={{
                    backgroundColor: isSelected ? PRIMARY_NAVY : 'white',
                    borderColor: isSelected ? PRIMARY_NAVY : '#E5E7EB',
                    borderWidth: 1,
                  }}
                  className="px-4 py-2 rounded-full mb-2 mr-2"
                >
                  <Text style={{ color: isSelected ? 'white' : '#4B5563', fontWeight: isSelected ? '600' : '400' }}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>

          {/* Kennisniveau */}
          <Text className="text-gray-700 font-semibold mb-3">Kennisniveau</Text>
          <View className="flex-row flex-wrap mb-4">
            {LEVEL_OPTIONS.map(opt => {
              const isSelected = knowledgeLevel === opt.id;
              return (
                <TouchableOpacity
                  key={opt.id}
                  onPress={() => setKnowledgeLevel(opt.id)}
                  style={{
                    backgroundColor: isSelected ? PRIMARY_NAVY : 'white',
                    borderColor: isSelected ? PRIMARY_NAVY : '#E5E7EB',
                    borderWidth: 1,
                  }}
                  className="px-4 py-2 rounded-full mb-2 mr-2"
                >
                  <Text style={{ color: isSelected ? 'white' : '#4B5563', fontWeight: isSelected ? '600' : '400' }}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>

          {/* Interesses */}
          <Text className="text-gray-700 font-semibold mb-3">Interesses (Meerdere mogelijk)</Text>
          <View className="flex-row flex-wrap mb-4">
            {TOPICS.map(opt => {
              const isSelected = interests.includes(opt.id);
              return (
                <TouchableOpacity
                  key={opt.id}
                  onPress={() => toggleInterest(opt.id)}
                  style={{
                    backgroundColor: isSelected ? GOLD_ACCENT : 'white',
                    borderColor: isSelected ? GOLD_ACCENT : '#E5E7EB',
                    borderWidth: 1,
                  }}
                  className="px-4 py-2 rounded-full mb-2 mr-2"
                >
                  <Text style={{ color: isSelected ? 'white' : '#4B5563', fontWeight: isSelected ? '600' : '400' }}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>

        </View>

        <TouchableOpacity 
          style={{ backgroundColor: PRIMARY_NAVY }}
          className="rounded-xl py-4 items-center mt-2 shadow-sm"
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-[16px]">Wijzigingen Opslaan</Text>
          )}
        </TouchableOpacity>
        
        <View className="h-10"></View>
      </ScrollView>
    </SafeAreaView>
  );
}
