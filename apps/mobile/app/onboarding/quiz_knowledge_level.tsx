import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, GraduationCap, BookOpen, Scroll } from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';

const PRIMARY_NAVY = '#121A2A';
const GOLD_ACCENT = '#C5A059';

export default function QuizKnowledgeLevelScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);

  const handleNext = async () => {
    if (selected) {
      await SecureStore.setItemAsync('onboarding_q2', selected);
    }
    router.push('/onboarding/quiz_topics_interest');
  };

  const levels = [
    {
      id: 'beginner',
      title: 'Beginner',
      subtitle: 'Ik ken de basis verhalen',
      Icon: GraduationCap,
      iconColor: '#2563EB',
      iconBg: '#EFF6FF',
    },
    {
      id: 'intermediate',
      title: 'Gevorderd',
      subtitle: 'Ik lees regelmatig uit de Schriften',
      Icon: BookOpen,
      iconColor: '#D97706',
      iconBg: '#FEF3C7',
    },
    {
      id: 'expert',
      title: 'Expert',
      subtitle: 'Theologische verdieping is mijn passie',
      Icon: Scroll,
      iconColor: '#9333EA',
      iconBg: '#FAF5FF',
    },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      {/* Progress Bar Header */}
      <View className="px-6 pt-4 pb-6 mt-4">
        <View className="w-full h-1.5 bg-gray-200 rounded-full">
          <View className="h-full rounded-full" style={{ width: '40%', backgroundColor: GOLD_ACCENT }} />
        </View>
        <View className="mt-4 flex-row items-center justify-between">
          <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
            <ChevronLeft color="#9CA3AF" size={24} />
          </TouchableOpacity>
          <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            Vraag 2 van 5
          </Text>
          <View className="w-6" />
        </View>
      </View>

      {/* Quiz Content */}
      <View className="flex-1 px-8 pt-4">
        <Text className="text-2xl font-bold mb-4" style={{ color: PRIMARY_NAVY }}>
          Hoe schat u uw kennis van de Bijbel (Statenvertaling) in?
        </Text>

        <View className="space-y-4 mt-6 gap-y-4">
          {levels.map((level) => {
            const isSelected = selected === level.id;
            return (
              <TouchableOpacity
                key={level.id}
                onPress={() => setSelected(level.id)}
                className="flex-row items-center p-5 rounded-2xl bg-white border-2 shadow-sm"
                style={{
                  borderColor: isSelected ? GOLD_ACCENT : 'transparent',
                }}
              >
                <View 
                  className="w-12 h-12 rounded-full items-center justify-center mr-4"
                  style={{ backgroundColor: level.iconBg }}
                >
                  <level.Icon color={level.iconColor} size={24} />
                </View>
                <View className="flex-1">
                  <Text className="font-bold text-base" style={{ color: PRIMARY_NAVY }}>
                    {level.title}
                  </Text>
                  <Text className="text-xs text-gray-400 uppercase tracking-tighter mt-1">
                    {level.subtitle}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Footer */}
      <View className="px-6 pb-8 pt-4 bg-transparent mt-auto">
        <TouchableOpacity
          onPress={handleNext}
          style={{ backgroundColor: PRIMARY_NAVY }}
          className="w-full py-4 rounded-xl items-center"
        >
          <Text className="text-white font-bold text-lg">
            Bevestigen
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
