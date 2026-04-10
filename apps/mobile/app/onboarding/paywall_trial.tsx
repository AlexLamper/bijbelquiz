import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';

const PRIMARY_NAVY = '#121A2A';
const GOLD_ACCENT = '#C5A059';

export default function PaywallTrialScreen() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false}>
        {/* Hero Visual */}
        <View className="h-96 w-full relative overflow-hidden">
          <ImageBackground
            source={{ uri: 'https://media.screensdesign.com/gasset/340af587-0112-4b1b-a629-256f17a41415.png' }}
            style={{ width: '100%', height: '100%' }}
          >
            {/* Gradient Overlay */}
            <View 
              style={{ 
                position: 'absolute', 
                left: 0, right: 0, bottom: 0, top: '40%',
                backgroundColor: 'rgba(255, 255, 255, 0.7)' 
              }} 
            />
            <View 
              style={{ 
                position: 'absolute', 
                left: 0, right: 0, bottom: 0, height: 120,
                backgroundColor: 'white',
              }} 
            />
          </ImageBackground>
          
          <TouchableOpacity 
            onPress={() => router.back()}
            className="absolute top-12 left-6 p-2 -ml-2"
          >
            <ArrowLeft color={PRIMARY_NAVY} size={28} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View className="flex-1 px-8 -mt-20 relative z-10 items-center">
          <View 
            className="px-4 py-1 rounded-full mb-4 shadow-sm"
            style={{ backgroundColor: GOLD_ACCENT }}
          >
            <Text className="text-white text-[10px] font-bold tracking-widest uppercase">
              Tijdelijk aanbod
            </Text>
          </View>
          
          <Text className="text-3xl font-bold text-center mb-4" style={{ color: PRIMARY_NAVY }}>
            Probeer 7 dagen gratis
          </Text>
          <Text className="text-gray-500 mb-10 leading-relaxed text-center">
            Ervaar de volledige kracht van Bijbelquiz zonder verplichtingen. Na de proefperiode €5,99 p/m.
          </Text>

          {/* Steps Visual */}
          <View className="flex-row items-start justify-between w-full px-2 mb-12">
            <View className="flex-col items-center">
              <View className="w-8 h-8 rounded-full items-center justify-center shadow-sm mb-2" style={{ backgroundColor: PRIMARY_NAVY }}>
                <Text className="text-white font-bold text-sm">1</Text>
              </View>
              <Text className="text-[10px] font-bold" style={{ color: PRIMARY_NAVY }}>Vandaag</Text>
              <Text className="text-[10px] text-gray-400 mt-0.5">Probeer gratis</Text>
            </View>

            <View className="flex-1 h-[2px] bg-gray-200 mt-4 mx-2" />

            <View className="flex-col items-center">
              <View className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center mb-2">
                <Text className="text-gray-400 font-bold text-sm">2</Text>
              </View>
              <Text className="text-[10px] font-bold text-gray-400">Dag 5</Text>
              <Text className="text-[10px] text-gray-400 mt-0.5">Herinnering</Text>
            </View>

            <View className="flex-1 h-[2px] bg-gray-200 mt-4 mx-2" />

            <View className="flex-col items-center">
              <View className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center mb-2">
                <Text className="text-gray-400 font-bold text-sm">3</Text>
              </View>
              <Text className="text-[10px] font-bold text-gray-400">Dag 7</Text>
              <Text className="text-[10px] text-gray-400 mt-0.5">Abonnement</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View className="px-8 pb-12 pt-4">
          <TouchableOpacity
            onPress={() => router.replace('/(tabs)')}
            style={{ backgroundColor: PRIMARY_NAVY }}
            className="w-full py-4 rounded-xl items-center shadow-xl mb-3"
          >
            <Text className="text-white font-bold text-lg">
              Start uw proefperiode
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.replace('/(tabs)')}
            className="w-full py-4 items-center"
          >
            <Text className="text-gray-400 text-sm font-medium">
              Misschien later
            </Text>
          </TouchableOpacity>
        </View>
        
      </ScrollView>
    </View>
  );
}
