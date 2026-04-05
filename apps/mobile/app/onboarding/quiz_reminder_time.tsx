import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Sun } from 'lucide-react-native';

const PRIMARY_NAVY = '#121A2A';
const GOLD_ACCENT = '#C5A059';

export default function QuizReminderTimeScreen() {
  const router = useRouter();
  const [selectedTime, setSelectedTime] = useState<string>('08:00');
  
  const quickOptions = ['07:30', '08:00', '09:00'];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      {/* Progress Bar Header */}
      <View className="px-6 pt-4 pb-6 mt-4">
        <View className="w-full h-1.5 bg-gray-200 rounded-full">
          <View className="h-full rounded-full" style={{ width: '80%', backgroundColor: GOLD_ACCENT }} />
        </View>
        <View className="mt-4 flex-row items-center justify-between">
          <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
            <ChevronLeft color="#9CA3AF" size={24} />
          </TouchableOpacity>
          <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            Vraag 4 van 5
          </Text>
          <View className="w-6" />
        </View>
      </View>

      {/* Quiz Content */}
      <View className="flex-1 px-8 pt-4">
        <Text className="text-2xl font-bold mb-4" style={{ color: PRIMARY_NAVY }}>
          Wanneer wilt u uw dagelijkse Schriftmoment?
        </Text>
        <Text className="text-gray-500 mb-10">
          Wij sturen u een vriendelijke herinnering om uw reeks vol te houden.
        </Text>

        <View className="flex-1 flex-col items-center justify-center pb-20">
          {/* Big Time Display */}
          <View className="w-56 h-56 rounded-full border-8 border-white shadow-xl items-center justify-center bg-white relative">
            <View className="absolute top-4">
              <Sun color="#FBBF24" size={28} />
            </View>
            <Text className="text-5xl font-bold mt-2" style={{ color: PRIMARY_NAVY }}>
              {selectedTime}
            </Text>
            <Text className="text-sm text-gray-400 font-bold uppercase mt-2 tracking-widest">
              's Morgens
            </Text>
          </View>

          {/* Quick Time Selection Buttons */}
          <View className="mt-10 flex-row gap-x-3">
            {quickOptions.map((time) => {
              const isSelected = selectedTime === time;
              return (
                <TouchableOpacity
                  key={time}
                  onPress={() => setSelectedTime(time)}
                  className="px-6 py-3 rounded-full border shadow-sm"
                  style={{
                    backgroundColor: isSelected ? PRIMARY_NAVY : '#FFFFFF',
                    borderColor: isSelected ? 'transparent' : '#F3F4F6'
                  }}
                >
                  <Text 
                    className="text-sm font-bold"
                    style={{ color: isSelected ? '#FFFFFF' : PRIMARY_NAVY }}
                  >
                    {time}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>
      </View>

      {/* Footer */}
      <View className="px-6 pb-8 pt-4 bg-transparent mt-auto">
        <TouchableOpacity
          onPress={() => router.push('/register?onboarding=true')}
          style={{ backgroundColor: PRIMARY_NAVY }}
          className="w-full py-4 rounded-xl items-center"
        >
          <Text className="text-white font-bold text-lg">
            Stel herinnering in
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
