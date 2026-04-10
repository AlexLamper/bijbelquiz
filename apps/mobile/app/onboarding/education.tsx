import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { CheckCircle } from 'lucide-react-native';

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
          <Image source={require('../../assets/images/logo-dark.png')} style={{ width: 40, height: 40 }} contentFit="contain" />
          <Text className="text-gray-400 font-medium">1 / 4</Text>
        </View>

        <View className="mb-10">
          <Text className="text-3xl font-bold mb-4" style={{ color: PRIMARY_NAVY }}>
            Test uw Bijbelkennis
          </Text>
          <Text className="text-lg text-gray-600 leading-relaxed mb-6">
            Ontdek de Schrift door onze interactieve bijbelquizzen. 
            Onze methode is ontworpen om uw begrip van de Bijbel te versterken.
          </Text>
        </View>

        <View className="gap-y-6">
            {/* Feature 1 */}
            <View className="flex-row items-center bg-gray-50 p-4 rounded-xl">
              <CheckCircle color={GOLD_ACCENT} size={24} />
              <Text className="ml-4 text-gray-800 font-medium text-base">Ontvang direct feedback na het beantwoorden van de vraag</Text>
            </View>
            {/* Feature 2 */}
            <View className="flex-row items-center bg-gray-50 p-4 rounded-xl">
              <CheckCircle color={GOLD_ACCENT} size={24} />
              <Text className="ml-4 text-gray-800 font-medium text-base">Leer meer over uw antwoord door onze uitleg en bijbelreferentie</Text>
            </View>
            {/* Feature 3 */}
            <View className="flex-row items-center bg-gray-50 p-4 rounded-xl">
              <CheckCircle color={GOLD_ACCENT} size={24} />
              <Text className="ml-4 text-gray-800 font-medium text-base">Ontdek verschillende categorieën</Text>
            </View>
            {/* Feature 4 */}
            <View className="flex-row items-center bg-gray-50 p-4 rounded-xl">
              <CheckCircle color={GOLD_ACCENT} size={24} />
              <Text className="ml-4 text-gray-800 font-medium text-base">Concureer tegen anderen op de ranglijst</Text>
            </View>
        </View>

        <View className="flex-1 justify-end mt-12 mb-8">
          <TouchableOpacity 
            onPress={() => router.push('/onboarding/quiz_bible_usage')}
            style={{ backgroundColor: PRIMARY_NAVY, padding: 18, borderRadius: 16, alignItems: 'center' }}
            className="shadow-lg shadow-gray-900/20"
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
