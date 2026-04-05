import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { BookOpen, CheckCircle } from 'lucide-react-native';

const PRIMARY_NAVY = '#121A2A';
const GOLD_ACCENT = '#C5A059';

// Using Tailwind / NativeWind where possible
export default function EducationStatenvertalingScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24 }}>
        
        {/* Progress header or top nav can be added here */}
        <View className="flex-row justify-between items-center mb-10 mt-4">
          <BookOpen color={PRIMARY_NAVY} size={28} />
          <Text className="text-gray-400 font-medium">1 / 4</Text>
        </View>

        <View className="mb-10">
          <Text className="text-3xl font-bold mb-4" style={{ color: PRIMARY_NAVY }}>
            Verdiep uw Kennis
          </Text>
          <Text className="text-lg text-gray-600 leading-relaxed mb-6">
            Ontdek de rijkdom van de Statenvertaling door interactieve quizzen. 
            Onze methode is ontworpen om uw begrip van de Bijbel te versterken.
          </Text>
        </View>

        <View className="gap-y-6">
            {/* Feature 1 */}
            <View className="flex-row items-center bg-gray-50 p-4 rounded-xl">
              <CheckCircle color={GOLD_ACCENT} size={24} />
              <Text className="ml-4 text-gray-800 font-medium text-base">Directe feedback en uitleg</Text>
            </View>
            {/* Feature 2 */}
            <View className="flex-row items-center bg-gray-50 p-4 rounded-xl">
              <CheckCircle color={GOLD_ACCENT} size={24} />
              <Text className="ml-4 text-gray-800 font-medium text-base">Historische en theologische context</Text>
            </View>
        </View>

        <View className="flex-1 justify-end mt-12 mb-8">
          <TouchableOpacity 
            onPress={() => router.push('/onboarding/quiz_bible_usage')}
            style={{ backgroundColor: GOLD_ACCENT, padding: 18, borderRadius: 16, alignItems: 'center' }}
            className="shadow-lg shadow-yellow-900/20"
          >
            <Text className="text-white font-bold text-lg uppercase tracking-wider">
              Volgende
            </Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
