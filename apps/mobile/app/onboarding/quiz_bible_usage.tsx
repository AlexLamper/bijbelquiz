import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';

const PRIMARY_NAVY = '#121A2A';
const GOLD_ACCENT = '#C5A059';

export default function QuizBibleUsageScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);

  const options = ['Dagelijks', 'Wekelijks', 'Af en toe', 'Ik begin net'];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      {/* Progress Bar Header */}
      <View className="px-6 pt-4 pb-6 mt-4">
        <View className="w-full h-1.5 bg-gray-200 rounded-full">
          <View className="h-full rounded-full" style={{ width: '20%', backgroundColor: GOLD_ACCENT }} />
        </View>
        <View className="mt-4 flex-row items-center justify-between">
          <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
            <ChevronLeft color="#9CA3AF" size={24} />
          </TouchableOpacity>
          <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            Vraag 1 van 5
          </Text>
          <View className="w-6" />
        </View>
      </View>

      {/* Quiz Content */}
      <View className="flex-1 px-8 pt-4">
        <Text className="text-2xl font-bold mb-4" style={{ color: PRIMARY_NAVY }}>
          Hoe vaak leest u in de Heilige Schrift?
        </Text>
        <Text className="text-gray-500 mb-10">
          Dit helpt ons de moeilijkheidsgraad van uw dagelijkse quiz aan te passen.
        </Text>

        <View className="space-y-4 gap-y-4">
          {options.map((option) => (
            <TouchableOpacity
              key={option}
              onPress={() => setSelected(option)}
              className={`w-full p-5 rounded-2xl bg-white border-2 flex-row items-center justify-between shadow-sm`}
              style={{
                borderColor: selected === option ? GOLD_ACCENT : 'transparent',
              }}
            >
              <Text className="text-lg font-medium" style={{ color: PRIMARY_NAVY }}>
                {option}
              </Text>
              <View
                className="w-6 h-6 rounded-full border-2 border-gray-200"
                style={{
                  backgroundColor: selected === option ? GOLD_ACCENT : 'transparent',
                  borderColor: selected === option ? GOLD_ACCENT : '#E5E7EB',
                }}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Footer */}
      <View className="px-6 pb-8 pt-4 bg-transparent mt-auto">
        <TouchableOpacity
          onPress={() => router.push('/onboarding/quiz_knowledge_level')}
          style={{ backgroundColor: PRIMARY_NAVY }}
          className="w-full py-4 rounded-xl items-center"
        >
          <Text className="text-white font-bold text-lg">
            Volgende
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
