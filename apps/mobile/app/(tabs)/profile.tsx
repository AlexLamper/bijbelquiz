import React from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../components/AuthProvider';
import { FontAwesome, Feather, Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const { user, loading, logout, isPremium } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-[#f8fafd]">
        <ActivityIndicator size="large" color="#1a2333" />
      </View>
    );
  }

  if (!user) {
    return (
      <SafeAreaView className="flex-1 bg-[#f8fafd]" edges={['top']}>
        <View className="flex-1 justify-center items-center p-8">
          <View className="bg-[#e4e7f1] p-8 rounded-full mb-6 relative">
            <Feather name="user" size={60} color="#8e94a8" />
          </View>
          <Text className="text-3xl font-serif font-bold mb-3 text-[#1a2333] text-center">Niet ingelogd</Text>
          <Text className="text-center text-[#5c687e] mb-10 leading-[24px] text-[16px]">
            Log in om je voortgang bij te houden, badges te verdienen en meer uit je Bijbelstudie te halen.
          </Text>
          <TouchableOpacity
            className="bg-[#1a2333] w-full py-4 rounded-[20px] shadow-sm active:opacity-90 transition-opacity"
            onPress={() => router.push('/login')}
          >
            <Text className="text-white font-bold text-center text-[17px]">Inloggen / Registreren</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#f8fafd]" edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <View className="items-center mb-8 pt-4">
          <View className="relative mb-6">
            {user.image ? (
              <Image source={{ uri: user.image }} className="w-28 h-28 rounded-full border-[1px] border-[#e4e7f1]" />
            ) : (
              <View className="w-28 h-28 rounded-full bg-[#dbe1ee] items-center justify-center border-[1px] border-[#e4e7f1]">
                <Text className="text-5xl font-serif font-bold text-[#1a2333]">{user.name?.charAt(0) || user.email?.charAt(0)}</Text>
              </View>
            )}
            {isPremium && (
               <View className="absolute -bottom-2 -right-2 bg-amber-400 w-10 h-10 rounded-full border-4 border-[#f8fafd] justify-center items-center shadow-sm">
                 <FontAwesome name="star" size={16} color="white" />
               </View>
            )}
          </View>

          <Text className="text-3xl font-serif font-bold text-[#1a2333] mb-1">{user.name || 'Gebruiker'}</Text>
          <Text className="text-[#8e94a8] text-[16px] mb-4">{user.email}</Text>
        </View>

        <View className="bg-white rounded-[24px] border border-[#e4e7f1] p-6 mb-6 shadow-sm flex-row items-center justify-between">
          <View>
             <Text className="text-[#8e94a8] uppercase text-[11px] font-bold tracking-widest mb-1.5">Totale XP</Text>
             <Text className="text-4xl font-black text-[#1a2333] font-serif">{user.xp ?? 0}</Text>
          </View>
          <View className="bg-[#f0f2f5] p-4 rounded-[16px]">
             <Ionicons name="flame" size={32} color="#f5a623" />
          </View>
        </View>

        {/* Instellingen List */}
        <View className="bg-white rounded-[24px] border border-[#e4e7f1] overflow-hidden mb-8 shadow-sm">
           <TouchableOpacity className="flex-row items-center justify-between p-5 border-b border-[#f0f2f5] active:bg-[#f8fafd]">
              <View className="flex-row items-center gap-4">
                 <Feather name="settings" size={20} color="#1a2333" />
                 <Text className="text-[#1a2333] font-medium text-[16px]">Account Instellingen</Text>
              </View>
              <Feather name="chevron-right" size={20} color="#8e94a8" />
           </TouchableOpacity>
           <TouchableOpacity className="flex-row items-center justify-between p-5 border-b border-[#f0f2f5] active:bg-[#f8fafd]">
              <View className="flex-row items-center gap-4">
                 <Feather name="bell" size={20} color="#1a2333" />
                 <Text className="text-[#1a2333] font-medium text-[16px]">Notificaties</Text>
              </View>
              <Feather name="chevron-right" size={20} color="#8e94a8" />
           </TouchableOpacity>
           <TouchableOpacity className="flex-row items-center justify-between p-5 active:bg-[#f8fafd]" onPress={logout}>
              <View className="flex-row items-center gap-4">
                 <Feather name="log-out" size={20} color="#ef4444" />
                 <Text className="text-[#ef4444] font-medium text-[16px]">Uitloggen</Text>
              </View>
           </TouchableOpacity>
        </View>

        <View className="items-center pb-10">
            <Text className="text-[13px] text-[#8e94a8]">Versie 1.0.0 (build 1)</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
