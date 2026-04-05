import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import { BrainCircuit } from 'lucide-react-native';

const PRIMARY_NAVY = '#121A2A';
const GOLD_ACCENT = '#C5A059';

export default function EducationalImpactScreen() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false}>
        {/* Header Image */}
        <View className="h-72 w-full overflow-hidden relative">
          <ImageBackground
            source={{ uri: 'https://media.screensdesign.com/gasset/bc9e9e76-df22-42f2-83c7-e209cf670a9c.png' }}
            style={{ width: '100%', height: '100%' }}
          >
            {/* Simple gradient overlay logic for RN */}
            <View 
              style={{ 
                position: 'absolute', 
                left: 0, right: 0, bottom: 0, top: 0,
                backgroundColor: 'rgba(255, 255, 255, 0.4)' 
              }} 
            />
            <View 
              style={{ 
                position: 'absolute', 
                left: 0, right: 0, bottom: 0, height: 80,
                backgroundColor: 'white',
                opacity: 0.8
              }} 
            />
          </ImageBackground>
        </View>

        {/* Content Wrapper */}
        <View className="flex-1 px-8 pt-4 pb-10 flex-col justify-center items-center text-center -mt-6 rounded-t-3xl bg-white">
          <View className="w-16 h-16 rounded-full bg-blue-50 items-center justify-center mb-6">
            <BrainCircuit color="#2563EB" size={32} />
          </View>
          
          <Text className="text-3xl font-bold mb-4 text-center" style={{ color: PRIMARY_NAVY }}>
            Jouw persoonlijke reis begint hier
          </Text>
          <Text className="text-gray-500 leading-relaxed text-lg text-center">
            Je bent op een prachtig moment in je reis. Wij helpen je een dagelijkse gewoonte op te bouwen en je inzicht in de belangrijkste verhalen met <Text style={{ color: GOLD_ACCENT, fontWeight: 'bold' }}>50% te versnellen</Text>.
          </Text>

          {/* Infographic */}
          <View className="mt-10 w-full flex-row items-end justify-center gap-x-6 h-32 px-4">
            <View className="flex-col items-center gap-y-2">
              <View className="w-12 bg-gray-200 rounded-t-lg h-12" />
              <Text className="text-[10px] uppercase font-bold text-gray-400">Lezen</Text>
            </View>
            <View className="flex-col items-center gap-y-2">
              <View className="w-12 rounded-t-lg h-24" style={{ backgroundColor: GOLD_ACCENT }} />
              <Text className="text-[10px] uppercase font-bold" style={{ color: GOLD_ACCENT }}>Bijbelquiz</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View className="px-6 pb-8 pt-4 bg-white mt-auto border-t border-gray-100">
        <TouchableOpacity
          onPress={() => router.push('/onboarding/quiz_reminder_time')}
          style={{ backgroundColor: PRIMARY_NAVY }}
          className="w-full py-4 rounded-xl items-center"
        >
          <Text className="text-white font-bold text-lg">
            Ik begrijp het
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
