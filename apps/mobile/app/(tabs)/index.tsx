import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { useAuth } from '../../components/AuthProvider';

// In a real app, this would come from an environment variable
// When testing on device, replace localhost with your computer's IP
const API_BASE_URL = 'http://192.168.68.107:3000';

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
  const { isPremium } = useAuth();

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
    // Helper to safely get category title
    const categoryName = (typeof item.categoryId === 'object' && item.categoryId?.title) 
      ? item.categoryId.title 
      : 'Algemeen';

    return (
      <View 
        className="bg-white dark:bg-slate-800 rounded-2xl mb-5 shadow-sm border border-border dark:border-slate-700 overflow-hidden"
      >
        <View className="p-5">
          <View className="flex-row justify-between items-start mb-3">
            <View className="bg-secondary/10 dark:bg-slate-700 px-2.5 py-1 rounded-md self-start">
              <Text className="text-secondary-foreground dark:text-slate-300 text-xs font-bold uppercase tracking-wider">{categoryName}</Text>
            </View>
            {item.isPremium && (
              <View className="bg-amber-600 px-2 py-1 rounded-md flex-row items-center gap-1 shadow-sm">
                <FontAwesome name="star" size={10} color="white" />
                <Text className="text-white text-[10px] font-bold uppercase tracking-wider">PRO</Text>
              </View>
            )}
          </View>
          
          <Text className="text-xl font-serif font-bold text-primary dark:text-white mb-2 leading-tight">{item.title}</Text>
          
          <Text className="text-muted-foreground dark:text-slate-400 mb-5 leading-5 h-10" numberOfLines={2}>
            {item.description || "Test je kennis en leer meer over dit onderwerp."}
          </Text>

          <View className="flex-row items-center gap-5 mb-5">
            <View className="flex-row items-center gap-1.5 opacity-80">
              <FontAwesome name="list-ul" size={14} color="#64748b" />
              <Text className="text-xs font-medium text-slate-500">{item.questions?.length || 0} vragen</Text>
            </View>
            <View className="flex-row items-center gap-1.5 opacity-80">
              <FontAwesome name="book" size={14} color="#64748b" />
              <Text className="text-xs font-medium text-slate-500">Leerzaam</Text>
            </View>
          </View>

          <TouchableOpacity 
            className={`flex-row items-center justify-center p-3.5 rounded-xl ${
              isLocked 
                ? 'bg-transparent border border-muted' 
                : 'bg-primary dark:bg-slate-700 shadow-md shadow-primary/20'
            } active:opacity-90 transition-opacity`}
            onPress={() => {
              if (isLocked) {
                alert("Dit is een Premium quiz. Upgrade je account om toegang te krijgen.");
              } else {
                router.push(`/quiz/${item._id}`);
              }
            }}
          >
            {isLocked ? (
              <>
                <FontAwesome name="lock" size={16} color="#94a3b8" style={{marginRight: 8}} />
                <Text className="font-bold text-slate-500">Ontgrendel</Text>
              </>
            ) : (
              <>
                <Text className="font-bold text-white dark:text-white mr-2 text-base">Start Quiz</Text>
                <FontAwesome name="arrow-right" size={14} color="white" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
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
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <FlatList
        data={quizzes}
        renderItem={renderQuizItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ padding: 20, paddingTop: 10 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#152d2f" />
        }
        ListHeaderComponent={
          <View className="mb-6 mt-2">
            <Text className="text-3xl font-serif font-bold text-primary dark:text-white">Ontdek Quizzes</Text>
            <Text className="text-muted-foreground mt-1">Kies een onderwerp en test je kennis.</Text>
            {error && (
              <View className="mt-4 p-4 bg-red-50 border border-red-100 rounded-xl flex-row items-center gap-3">
                <FontAwesome name="exclamation-triangle" size={16} color="#ef4444" />
                <Text className="text-red-600 flex-1 font-medium">{error}</Text>
                <TouchableOpacity onPress={onRefresh}>
                    <Text className="text-red-700 font-bold">Opnieuw</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          !error && !loading ? (
            <View className="items-center justify-center py-20">
              <FontAwesome name="search" size={40} color="#cbd5e1" />
              <Text className="text-slate-400 mt-4 text-center">Geen quizzes gevonden.</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

