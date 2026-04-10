import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Check, Target, Clock, Layers } from 'lucide-react-native';
import { useAuth } from '../../components/AuthProvider';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../../constants/api';

const PRIMARY_NAVY = '#121A2A';
const GOLD_ACCENT = '#C5A059';

export default function OnboardingCompleteScreen() {
  const router = useRouter();
  const { updateUser } = useAuth();
  const [levelInfo, setLevelInfo] = useState<string>('Gevorderd');
  const [usageInfo, setUsageInfo] = useState<string>('Dagelijks');
  const [topicsInfo, setTopicsInfo] = useState<string>("Diverse Thema's");

  useEffect(() => {
    const loadAndSaveData = async () => {
      try {
        const q1 = await SecureStore.getItemAsync('onboarding_q1');
        const q2 = await SecureStore.getItemAsync('onboarding_q2');
        const q3Str = await SecureStore.getItemAsync('onboarding_q3');
        const q3 = q3Str ? JSON.parse(q3Str) : [];

        // Set UI state based on responses
        if (q2 === 'beginner') setLevelInfo('Beginner');
        else if (q2 === 'intermediate') setLevelInfo('Gevorderd');
        else if (q2 === 'expert') setLevelInfo('Expert');

        if (q1) setUsageInfo(q1);

        if (q3 && q3.length > 0) {
          const topicLabels: Record<string, string> = {
            'prophets': 'Profeten',
            'kings': 'Koningen',
            'parables': 'Gelijkenissen',
            'miracles': 'Wonderen',
            'creation': 'Schepping',
            'apostles': 'Apostelen'
          };
          const selectedLabels = q3.map((id: string) => topicLabels[id] || id);
          if (selectedLabels.length <= 2) {
            setTopicsInfo(selectedLabels.join(', '));
          } else {
            setTopicsInfo(`${selectedLabels[0]}, ${selectedLabels[1]} +${selectedLabels.length - 2}`);
          }
        }

        const sessionToken = await SecureStore.getItemAsync('userToken');
        if (!sessionToken) return;

        if (q1 || q2 || q3.length > 0) {
          const response = await fetch(`${API_BASE_URL}/api/user/onboarding`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${sessionToken}`,
            },
            body: JSON.stringify({
              bibleReadingFrequency: q1,
              knowledgeLevel: q2,
              interests: q3,
            }),
          });
          
          if (response.ok) {
            await SecureStore.deleteItemAsync('onboarding_q1');
            await SecureStore.deleteItemAsync('onboarding_q2');
            await SecureStore.deleteItemAsync('onboarding_q3');
            await updateUser({ onboardingCompleted: true });
          }
        } else {
           await updateUser({ onboardingCompleted: true });
        }
      } catch (err) {
          console.error('Failed to save onboarding data:', err);
        }
      };
      
      loadAndSaveData();

      // Navigate to Paywall or Dashboard after some seconds
      const timer = setTimeout(() => {
        router.replace('/onboarding/paywall');
      }, 3000);

      return () => clearTimeout(timer);
    }, []);

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 32 }}>
        
        {/* Check Mark */}
        <View className="w-24 h-24 rounded-full bg-green-50 items-center justify-center mb-8 mx-auto">
          <Check color="#22C55E" size={48} />
        </View>

        {/* Title */}
        <Text className="text-3xl font-bold text-center mb-4" style={{ color: PRIMARY_NAVY }}>
          Uw plan is gereed
        </Text>
        <Text className="text-gray-500 text-center mb-12">
          Op basis van uw antwoorden hebben wij een persoonlijk leertraject samengesteld voor de komende 30 dagen.
        </Text>

        {/* Plan Highlights */}
        <View className="w-full space-y-4 mb-16 gap-y-4">
          <View className="flex-row items-center gap-x-4 bg-slate-50 p-4 rounded-xl">
            <Target color={GOLD_ACCENT} size={24} />
            <Text className="text-sm font-bold" style={{ color: PRIMARY_NAVY }}>Niveau: {levelInfo}</Text>
          </View>
          <View className="flex-row items-center gap-x-4 bg-slate-50 p-4 rounded-xl">
            <Clock color={GOLD_ACCENT} size={24} />
            <Text className="text-sm font-bold" style={{ color: PRIMARY_NAVY }}>Dagelijkse Quiz: {usageInfo}</Text>
          </View>
          <View className="flex-row items-center gap-x-4 bg-slate-50 p-4 rounded-xl">
            <Layers color={GOLD_ACCENT} size={24} />
            <Text className="text-sm font-bold" style={{ color: PRIMARY_NAVY }}>Thema's: {topicsInfo}</Text>
          </View>
        </View>

        {/* Footer */}
        <View className="mt-auto items-center">
          <TouchableOpacity
            onPress={() => router.push('/onboarding/paywall_trial')}
            style={{ backgroundColor: PRIMARY_NAVY }}
            className="w-full py-4 rounded-xl items-center"
          >
            <Text className="text-white font-bold text-lg">
              Start uw gepersonaliseerde reis
            </Text>
          </TouchableOpacity>
          <Text className="mt-4 text-xs text-center text-gray-400">
            Door verder te gaan gaat u akkoord met onze voorwaarden.
          </Text>
        </View>
        
      </ScrollView>
    </SafeAreaView>
  );
}
