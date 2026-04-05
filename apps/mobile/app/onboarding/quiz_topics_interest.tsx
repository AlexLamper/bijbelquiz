import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Mic, Crown, Wheat, Sparkles, Mountain, Users } from 'lucide-react-native';

const PRIMARY_NAVY = '#121A2A';
const GOLD_ACCENT = '#C5A059';

export default function QuizTopicsInterestScreen() {
  const router = useRouter();
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

  const topics = [
    { id: 'prophets', label: 'Profeten', Icon: Mic, iconBg: '#EFF6FF', iconColor: PRIMARY_NAVY },
    { id: 'kings', label: 'Koningen', Icon: Crown, iconBg: '#FEF3C7', iconColor: GOLD_ACCENT },
    { id: 'parables', label: 'Gelijkenissen', Icon: Wheat, iconBg: '#F0FDF4', iconColor: '#15803D' },
    { id: 'miracles', label: 'Wonderen', Icon: Sparkles, iconBg: '#FAF5FF', iconColor: '#7E22CE' },
    { id: 'creation', label: 'Schepping', Icon: Mountain, iconBg: '#ECFEFF', iconColor: '#0E7490' },
    { id: 'apostles', label: 'Apostelen', Icon: Users, iconBg: '#FEF2F2', iconColor: '#B91C1C' },
  ];

  const toggleTopic = (id: string) => {
    setSelectedTopics(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      {/* Progress Bar Header */}
      <View className="px-6 pt-4 pb-6 mt-4">
        <View className="w-full h-1.5 bg-gray-200 rounded-full">
          <View className="h-full rounded-full" style={{ width: '60%', backgroundColor: GOLD_ACCENT }} />
        </View>
        <View className="mt-4 flex-row items-center justify-between">
          <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
            <ChevronLeft color="#9CA3AF" size={24} />
          </TouchableOpacity>
          <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            Vraag 3 van 5
          </Text>
          <View className="w-6" />
        </View>
      </View>

      {/* Quiz Content */}
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 32, paddingTop: 16 }}>
        <Text className="text-2xl font-bold mb-4" style={{ color: PRIMARY_NAVY }}>
          Laten we uw Bijbelreis begrijpen
        </Text>
        <Text className="text-gray-500 mb-8">
          Kies de thema's die u het meest boeien om uw leertraject aan te passen.
        </Text>

        <View className="flex-row flex-wrap justify-between">
          {topics.map((topic) => {
            const isSelected = selectedTopics.includes(topic.id);
            return (
              <TouchableOpacity
                key={topic.id}
                onPress={() => toggleTopic(topic.id)}
                className="w-[48%] mb-4 p-4 rounded-xl bg-white border-2 shadow-sm items-center justify-center"
                style={{
                  borderColor: isSelected ? GOLD_ACCENT : 'transparent',
                }}
              >
                <View 
                  className="w-12 h-12 rounded-full items-center justify-center mb-3"
                  style={{ backgroundColor: topic.iconBg }}
                >
                  <topic.Icon color={topic.iconColor} size={24} />
                </View>
                <Text className="text-sm font-bold text-center" style={{ color: PRIMARY_NAVY }}>
                  {topic.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Footer */}
      <View className="px-6 pb-8 pt-4 bg-transparent mt-auto">
        <TouchableOpacity
          onPress={() => router.push('/onboarding/educational_impact')}
          style={{ backgroundColor: PRIMARY_NAVY }}
          className="w-full py-4 rounded-xl items-center"
        >
          <Text className="text-white font-bold text-lg">
            Kies thema's
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
