import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../components/AuthProvider';
import { FontAwesome } from '@expo/vector-icons';

export default function ProfileScreen() {
  const { user, loading, logout, isPremium } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" color="#152d2f" />
      </View>
    );
  }

  if (!user) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <View className="flex-1 justify-center items-center p-6">
          <View className="bg-secondary/10 p-6 rounded-full mb-6">
            <FontAwesome name="user-circle" size={80} color="#dcd7ce" />
          </View>
          <Text className="text-2xl font-serif font-bold mb-3 text-primary text-center">Niet ingelogd</Text>
          <Text className="text-center text-muted-foreground mb-8 leading-6">
            Log in om je voortgang bij te houden, badges te verdienen en premium features te gebruiken.
          </Text>
          <TouchableOpacity 
            className="bg-primary w-full py-4 rounded-xl shadow-sm active:opacity-90 transition-opacity"
            onPress={() => router.push('/login')}
          >
            <Text className="text-primary-foreground font-bold text-center text-lg">Inloggen</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View className="items-center mb-8">
          {user.image ? (
            <Image source={{ uri: user.image }} className="w-24 h-24 rounded-full mb-4 border-4 border-white shadow-sm" />
          ) : (
            <View className="w-24 h-24 rounded-full bg-secondary/20 items-center justify-center mb-4 border-4 border-white shadow-sm">
              <Text className="text-4xl font-bold text-secondary-foreground">{user.name?.charAt(0) || user.email?.charAt(0)}</Text>
            </View>
          )}
          <Text className="text-2xl font-serif font-bold text-primary mb-1">{user.name || 'Gebruiker'}</Text>
          <Text className="text-muted-foreground mb-3">{user.email}</Text>
          
          {isPremium ? (
            <View className="bg-amber-100 border border-amber-200 px-4 py-1.5 rounded-full flex-row items-center gap-2">
              <FontAwesome name="star" size={14} color="#d97706" />
              <Text className="text-amber-700 font-bold text-xs uppercase tracking-wide">Premium Lid</Text>
            </View>
          ) : (
            <TouchableOpacity 
              className="bg-primary/10 px-4 py-1.5 rounded-full flex-row items-center gap-2"
              onPress={() => alert("Ga naar de website om te upgraden!")}
            >
              <FontAwesome name="arrow-up" size={12} color="#152d2f" />
              <Text className="text-primary font-bold text-xs uppercase">Free Plan</Text>
            </TouchableOpacity>
          )}
        </View>

        <View className="bg-card rounded-2xl border border-border overflow-hidden mb-6 shadow-sm">
          <TouchableOpacity className="flex-row items-center p-4 border-b border-border bg-white active:bg-slate-50">
            <View className="w-10 h-10 rounded-full bg-blue-50 items-center justify-center mr-4">
              <FontAwesome name="trophy" size={18} color="#3b82f6" />
            </View>
            <Text className="flex-1 font-bold text-primary text-base">Mijn Resultaten</Text>
            <FontAwesome name="chevron-right" size={14} color="#d4cfc6" />
          </TouchableOpacity>
          
          <TouchableOpacity className="flex-row items-center p-4 border-b border-border bg-white active:bg-slate-50">
            <View className="w-10 h-10 rounded-full bg-slate-100 items-center justify-center mr-4">
              <FontAwesome name="gear" size={18} color="#4b5563" />
            </View>
            <Text className="flex-1 font-bold text-primary text-base">Instellingen</Text>
            <FontAwesome name="chevron-right" size={14} color="#d4cfc6" />
          </TouchableOpacity>
          
          <TouchableOpacity className="flex-row items-center p-4 bg-white active:bg-slate-50" onPress={() => console.log('Help')}>
            <View className="w-10 h-10 rounded-full bg-emerald-50 items-center justify-center mr-4">
              <FontAwesome name="question" size={18} color="#10b981" />
            </View>
            <Text className="flex-1 font-bold text-primary text-base">Help & Ondersteuning</Text>
            <FontAwesome name="chevron-right" size={14} color="#d4cfc6" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          className="bg-red-50 border border-red-100 p-4 rounded-xl flex-row justify-center items-center gap-2 mb-8 active:bg-red-100"
          onPress={logout}
        >
          <FontAwesome name="sign-out" size={18} color="#ef4444" />
          <Text className="text-red-600 font-bold text-base">Uitloggen</Text>
        </TouchableOpacity>
        
        <View className="items-center">
            <Text className="text-xs text-muted-foreground">Versie 1.0.0 (build 1)</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
