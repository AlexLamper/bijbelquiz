import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import { X, CheckCircle2 } from 'lucide-react-native';

const PRIMARY_NAVY = '#121A2A';
const GOLD_ACCENT = '#C5A059';

export default function PaywallScreen() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: PRIMARY_NAVY }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false}>
        {/* Header Image */}
        <View className="h-64 w-full relative">
          <ImageBackground
            source={{ uri: 'https://media.screensdesign.com/gasset/634c6cab-8127-4776-ac5d-1f9f6efb3b3e.png' }}
            style={{ width: '100%', height: '100%', opacity: 0.6 }}
          >
            {/* Simple gradient overlay logic for RN */}
            <View 
              style={{ 
                position: 'absolute', 
                left: 0, right: 0, bottom: 0, top: 0,
                backgroundColor: 'rgba(18, 26, 42, 0.4)' 
              }} 
            />
            <View 
              style={{ 
                position: 'absolute', 
                left: 0, right: 0, bottom: 0, height: 60,
                backgroundColor: PRIMARY_NAVY,
                opacity: 0.9
              }} 
            />
          </ImageBackground>
          
          <TouchableOpacity 
            onPress={() => router.push('/(tabs)')}
            className="absolute top-12 right-6 w-8 h-8 rounded-full bg-black/30 items-center justify-center flex-row"
          >
            <X color="white" size={20} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View className="flex-1 px-8 pt-2">
          <Text className="text-white text-3xl font-bold mb-2">Word Premium Lid</Text>
          <Text className="text-gray-400 text-sm mb-8">
            Ontvang volledige toegang tot de diepste lagen van de Schrift.
          </Text>

          {/* Features List */}
          <View className="space-y-4 mb-10 gap-y-4">
            <View className="flex-row items-center gap-x-3">
              <CheckCircle2 color={GOLD_ACCENT} size={24} />
              <Text className="text-white text-sm">Onbeperkt aantal dagelijkse vragen</Text>
            </View>
            <View className="flex-row items-center gap-x-3">
              <CheckCircle2 color={GOLD_ACCENT} size={24} />
              <Text className="text-white text-sm">Exclusieve 'Statenvertaling' Verdieping</Text>
            </View>
            <View className="flex-row items-center gap-x-3">
              <CheckCircle2 color={GOLD_ACCENT} size={24} />
              <Text className="text-white text-sm">Ad-vrij leren & Offline modus</Text>
            </View>
          </View>

          {/* Pricing Options */}
          <View className="space-y-3 gap-y-3">
            <TouchableOpacity className="w-full p-4 rounded-2xl border-2 flex-row items-center justify-between bg-white/5" style={{ borderColor: GOLD_ACCENT }}>
              <View>
                <Text className="text-white font-bold text-lg">Jaarlijks</Text>
                <Text className="text-xs text-gray-400 uppercase tracking-widest mt-1">Best verkocht</Text>
              </View>
              <View className="items-end">
                <Text className="text-white font-bold text-lg">
                  €4,99 <Text className="text-xs font-normal text-gray-400">/ mnd</Text>
                </Text>
                <Text className="text-[10px] mt-1" style={{ color: GOLD_ACCENT }}>
                  €59,99 per jaar
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity className="w-full p-4 rounded-2xl border-2 border-white/10 flex-row items-center justify-between">
              <View>
                <Text className="text-white font-bold text-lg">Maandelijks</Text>
              </View>
              <View className="items-end">
                <Text className="text-white font-bold text-lg">
                  €9,99 <Text className="text-xs font-normal text-gray-400">/ mnd</Text>
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View className="p-8 pb-12 mt-4 bg-transparent">
          <TouchableOpacity
            onPress={() => router.push('/onboarding/paywall_trial')}
            style={{ backgroundColor: GOLD_ACCENT }}
            className="w-full py-4 rounded-xl items-center shadow-lg"
          >
            <Text className="font-bold text-lg" style={{ color: PRIMARY_NAVY }}>
              Activeer Premium
            </Text>
          </TouchableOpacity>
          <Text className="mt-4 text-[10px] text-gray-500 text-center px-4 leading-relaxed">
            Na de proefperiode wordt het bedrag in rekening gebracht. Annuleer op elk gewenst moment.
          </Text>
        </View>
        
      </ScrollView>
    </View>
  );
}
