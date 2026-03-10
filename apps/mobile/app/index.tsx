import React, { useEffect } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../components/AuthProvider';
import { FontAwesome, Feather } from '@expo/vector-icons';

export default function WelcomeScreen() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/(tabs)');
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-[#f8fafd]">
        <ActivityIndicator size="large" color="#1a2333" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#f8fafd]" edges={['top', 'bottom']}>
      <View className="flex-1 px-8 pt-20 pb-10 justify-between">
        
        {/* Decorative Circles */}
        <View className="absolute top-[-50] right-[-50] w-64 h-64 border-[1px] border-[#d8e0f0] rounded-full opacity-60"></View>
        <View className="absolute top-10 right-[-100] w-80 h-80 border-[1px] border-[#d8e0f0] rounded-full opacity-40"></View>

        <View className="mt-8">
          <Text className="text-[44px] font-serif font-bold text-[#1a2333] mb-6 leading-[50px]">
            Groeien in{'\n'}je geloof.
          </Text>
          <Text className="text-[#5c687e] text-[16px] leading-[24px] mb-10 w-[90%]">
            Ontdek, leer en test je kennis van de Bijbel op een leuke en interactieve manier.
          </Text>

          <View className="gap-5">
            <View className="flex-row items-center gap-4">
              <Feather name="user" size={20} color="#1a2333" />
              <Text className="text-[#1a2333] text-[16px] font-medium">Persoonlijke bijbelreis</Text>
            </View>
            <View className="flex-row items-center gap-4">
              <Feather name="sliders" size={20} color="#1a2333" />
              <Text className="text-[#1a2333] text-[16px] font-medium">Test je kennis</Text>
            </View>
            <View className="flex-row items-center gap-4">
              <Feather name="check-square" size={20} color="#1a2333" />
              <Text className="text-[#1a2333] text-[16px] font-medium">Dagelijkse streaks</Text>
            </View>
          </View>
        </View>

        <View className="gap-4">
          <TouchableOpacity
            className="border-[1.5px] border-[#1a2333] flex-row justify-center py-4 rounded-[20px] items-center bg-white shadow-sm"
            onPress={() => alert('Apple login weggelaten in demo')}
          >
            <FontAwesome name="apple" size={20} color="#000" style={{ marginRight: 10, marginBottom: 2 }} />
            <Text className="text-[#1a2333] font-bold text-[17px]">Begin met Apple</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="bg-[#232b38] py-4 rounded-[20px] items-center shadow-lg"
            onPress={() => router.push('/register')}
          >
            <Text className="text-white font-bold text-[17px]">Continue with email</Text>
          </TouchableOpacity>
          
          <TouchableOpacity className="mt-2 items-center" onPress={() => router.push('/login')}>
            <Text className="text-[#1a2333] text-[15px]">
              Heb je al een account? <Text className="font-bold">Log in.</Text>
            </Text>
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
}
