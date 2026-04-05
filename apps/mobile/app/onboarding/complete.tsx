import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Check, Target, Clock, Layers } from 'lucide-react-native';

const PRIMARY_NAVY = '#121A2A';
const GOLD_ACCENT = '#C5A059';

export default function OnboardingCompleteScreen() {
  const router = useRouter();

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
            <Text className="text-sm font-bold" style={{ color: PRIMARY_NAVY }}>Niveau: Gevorderd</Text>
          </View>
          <View className="flex-row items-center gap-x-4 bg-slate-50 p-4 rounded-xl">
            <Clock color={GOLD_ACCENT} size={24} />
            <Text className="text-sm font-bold" style={{ color: PRIMARY_NAVY }}>Dagelijkse Quiz: 08:00</Text>
          </View>
          <View className="flex-row items-center gap-x-4 bg-slate-50 p-4 rounded-xl">
            <Layers color={GOLD_ACCENT} size={24} />
            <Text className="text-sm font-bold" style={{ color: PRIMARY_NAVY }}>Thema's: Koningen, Profeten +4</Text>
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
