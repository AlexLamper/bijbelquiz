import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Image, Alert, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { useAuth } from '../../components/AuthProvider';
import { API_BASE_URL } from '../../constants/api';

interface Quiz {
  _id: string;
  title: string;
  description: string;
  difficulty: string;
  isPremium?: boolean;
  questions?: any[];
  category?: { title: string };
  categoryId?: { title: string; _id: string } | string;
  slug?: string;
}

export default function HomeScreen() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { isPremium, user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const fetchQuizzes = async () => {
    try {
      setError(null);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

      const response = await fetch(`${API_BASE_URL}/api/quizzes`, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) throw new Error(`Server returned ${response.status}`);
      
      const data = await response.json();
      setQuizzes(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to fetch quizzes:', err);
      const msg = err.name === 'AbortError' 
        ? 'Verbindingstime-out. Is de server gestart?' 
        : 'Kon geen verbinding maken met de server.';
      setError(msg);
      // Only alert on manual refresh or first load
      if (refreshing || loading) {
           // Silence Alert for better UX if we already show it in UI
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchQuizzes();
  };

  const renderQuizItem = ({ item }: { item: Quiz }) => {
    const isLocked = item.isPremium && !isPremium;
    const categoryName = (typeof item.categoryId === 'object' && item.categoryId?.title) 
      ? item.categoryId.title 
      : 'Algemeen';

    return (
      <TouchableOpacity 
        className="w-[200px] mr-4 mb-2"
        onPress={() => {
          if (isLocked) {
            alert("Dit is een Premium quiz.");
          } else {
            router.push(`/quiz/${item._id}`);
          }
        }}
        activeOpacity={0.8}
      >
        <View className="h-[200px] bg-[#dbe1ee] rounded-2xl mb-3 overflow-hidden border border-slate-200 shadow-sm relative">
            {/* Fake Image Background */}
            <View className="absolute inset-0 bg-[#3c4a63] opacity-10"></View>
            <View className="absolute inset-0 justify-center items-center">
                <FontAwesome name="image" size={40} color="#bac6da" />
            </View>

            {item.isPremium && (
              <View className="absolute top-3 right-3 bg-amber-500 px-2 py-1 rounded-md flex-row items-center gap-1 shadow-sm">
                <FontAwesome name="star" size={10} color="white" />
                <Text className="text-white text-[10px] font-bold uppercase tracking-wider">PRO</Text>
              </View>
            )}
        </View>
        
        <Text className="text-[17px] font-bold text-[#1c223a] mb-1 leading-tight">{item.title}</Text>
        
        <View className="flex-col gap-0.5">
            <Text className="text-[12px] text-[#5c687e]">Moeilijkheid: {item.difficulty === 'hard' ? 'Moeilijk' : item.difficulty === 'medium' ? 'Gemiddeld' : 'Makkelijk'}</Text>
            <Text className="text-[12px] text-[#5c687e]">Status: Niet gestart</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" color="#152d2f" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#f8fafd]" edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#152d2f" />
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View className="px-5">
            <View className="items-center mt-2 mb-6">
              <Text className="text-3xl font-serif text-[#1c223a]">Bijbel Quiz</Text>
            </View>

            {/* Search Bar */}
            <View className="bg-[#f0f2f5] rounded-xl flex-row items-center px-4 py-3 mb-6">
              <FontAwesome name="search" size={16} color="#8e94a8" className="mr-3" />
              <TextInput 
                placeholder="Zoeken in quizzen of onderwerpen"
                placeholderTextColor="#8e94a8"
                className="flex-1 ml-3 text-[15px] font-medium text-[#1c223a]"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {/* Categories */}
            <View className="-mx-5 mb-8">
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }} className="flex-row">
                {['Oude Testament', 'Nieuwe Testament', 'Theologie', 'Bijbelse Figuren'].map((cat, idx) => (
                  <TouchableOpacity key={idx} className="bg-[#e4e7f1] rounded-full px-5 py-2 mr-3">
                    <Text className="text-[#3c4257] font-medium text-[13px]">{cat}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-[19px] font-semibold text-[#1c223a]">Aanbevolen voor jou</Text>
            </View>

            {error && (
              <View className="mt-4 p-4 bg-red-50 border border-red-100 rounded-xl flex-row items-center gap-3 mb-4">
                <FontAwesome name="exclamation-triangle" size={16} color="#ef4444" />
                <Text className="text-red-600 flex-1 font-medium">{error}</Text>
                <TouchableOpacity onPress={onRefresh}>
                    <Text className="text-red-700 font-bold">Opnieuw</Text>
                </TouchableOpacity>
              </View>
            )}
        </View>

        <FlatList
          data={quizzes}
          renderItem={renderQuizItem}
          keyExtractor={(item) => item._id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 10 }}
        />

        <View className="px-5 mt-6 mb-4 flex-row items-center justify-between">
          <Text className="text-[19px] font-semibold text-[#1c223a]">Thema's voor jou</Text>
          <View className="flex-row gap-1">
             <View className="w-1.5 h-1.5 bg-[#1c223a] rounded-full"></View>
             <View className="w-1.5 h-1.5 bg-[#c8d1e0] rounded-full"></View>
             <View className="w-1.5 h-1.5 bg-[#c8d1e0] rounded-full"></View>
          </View>
        </View>
        
        <View className="px-5">
           <View className="h-[140px] bg-[#dbe1ee] rounded-2xl w-full border border-slate-200 overflow-hidden relative">
               <View className="absolute inset-0 bg-[#3c4a63] opacity-20"></View>
           </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

