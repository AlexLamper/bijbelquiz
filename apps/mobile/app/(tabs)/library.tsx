import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../components/AuthProvider';
import { getQuizImage } from '../../constants/quizImages';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../../constants/api';

interface ProgressItem {
  _id: string;
  quizId: {
    _id: string;
    title: string;
    slug?: string;
    imageUrl?: string;
    categoryId?: { title: string };
  } | null;
  score: number;
  totalQuestions: number;
  completedAt: string;
}

export default function LibraryScreen() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [progress, setProgress] = useState<ProgressItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProgress = async () => {
    try {
      setError(null);
      const token = await SecureStore.getItemAsync('userToken');
      
      if (!token) {
        setProgress([]);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/user/progress`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProgress(Array.isArray(data) ? data : []);
      } else {
        setError('Kon geschiedenis niet laden.');
      }
    } catch (err) {
      console.error('Failed to fetch progress:', err);
      setError('Netwerkfout opgetreden.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchProgress();
    }
  }, [authLoading, user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProgress();
  };

  if (authLoading || loading) {
    return (
      <View className="flex-1 justify-center items-center bg-[#f8fafd]">
        <ActivityIndicator size="large" color="#1a2333" />
      </View>
    );
  }

  if (!user) {
    return (
      <SafeAreaView className="flex-1 bg-[#f8fafd]" edges={['top']}>
        <View className="flex-1 justify-center items-center px-8">
          <View className="bg-[#e4e7f1] p-8 rounded-full mb-6">
            <FontAwesome name="book" size={60} color="#8e94a8" />
          </View>
          <Text className="text-3xl font-serif font-bold mb-3 text-[#1a2333] text-center">Nog geen bibliotheek</Text>
          <Text className="text-center text-[#5c687e] mb-10 leading-[24px] text-[16px]">
            Log in om je voortgang en voltooide quizzen bij te houden.
          </Text>
          <TouchableOpacity
            className="bg-[#1a2333] w-full py-4 rounded-[20px] shadow-sm active:opacity-90"
            onPress={() => router.push('/login')}
          >
            <Text className="text-white font-bold text-center text-[17px]">Inloggen</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const renderProgressItem = ({ item }: { item: ProgressItem }) => {
    const percentage = item.totalQuestions > 0 
      ? Math.round((item.score / item.totalQuestions) * 100)
      : 0;
    
    const categoryName = item.quizId?.categoryId?.title || 'Algemeen';
    const completedDate = new Date(item.completedAt).toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    return (
      <TouchableOpacity
        className="bg-white rounded-2xl border border-[#e4e7f1] mb-4 overflow-hidden shadow-sm active:scale-[0.98]"
        onPress={() => {
          if (item.quizId) {
            router.push(`/quiz/${item.quizId._id}`);
          }
        }}
      >
        <View className="flex-row">
          <View className="w-24 h-24 bg-[#dbe1ee] relative">
            {item.quizId?.imageUrl && getQuizImage(item.quizId.imageUrl) ? (
              <>
                <Image
                  source={getQuizImage(item.quizId.imageUrl)}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                />
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.12)' }} />
              </>
            ) : (
              <View className="flex-1 items-center justify-center">
                <FontAwesome name="book" size={28} color="#bac6da" />
              </View>
            )}
          </View>
          
          <View className="flex-1 p-4 justify-between">
            <View>
              <Text className="text-[16px] font-bold text-[#1a2333] mb-1 leading-tight" numberOfLines={2}>
                {item.quizId?.title || 'Onbekende Quiz'}
              </Text>
              <Text className="text-[12px] text-[#8e94a8]">{categoryName}</Text>
            </View>
            
            <View className="flex-row items-center justify-between mt-2">
              <View className="flex-row items-center gap-3">
                <View className={`px-2 py-1 rounded-md ${
                  percentage >= 80 ? 'bg-emerald-100' : 
                  percentage >= 60 ? 'bg-blue-100' : 
                  'bg-slate-100'
                }`}>
                  <Text className={`text-[12px] font-bold ${
                    percentage >= 80 ? 'text-emerald-700' : 
                    percentage >= 60 ? 'text-blue-700' : 
                    'text-slate-600'
                  }`}>
                    {percentage}%
                  </Text>
                </View>
                <Text className="text-[12px] text-[#8e94a8]">{item.score}/{item.totalQuestions}</Text>
              </View>
              <Text className="text-[11px] text-[#8e94a8]">{completedDate}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f8fafd]" edges={['top']}>
      <View className="px-5 pt-6 pb-4">
        <Text className="text-3xl font-serif font-bold text-[#1a2333] mb-2">Mijn Bibliotheek</Text>
        <Text className="text-[#5c687e] text-[15px]">
          {progress.length > 0 
            ? `${progress.length} ${progress.length === 1 ? 'quiz' : 'quizzen'} voltooid`
            : 'Nog geen voltooide quizzen'}
        </Text>
      </View>

      {error && (
        <View className="mx-5 mb-4 p-4 bg-red-50 border border-red-100 rounded-xl flex-row items-center gap-3">
          <FontAwesome name="exclamation-triangle" size={16} color="#ef4444" />
          <Text className="text-red-600 flex-1 font-medium">{error}</Text>
          <TouchableOpacity onPress={onRefresh}>
            <Text className="text-red-700 font-bold">Opnieuw</Text>
          </TouchableOpacity>
        </View>
      )}

      {progress.length === 0 && !loading ? (
        <View className="flex-1 justify-center items-center px-8">
          <View className="bg-[#e4e7f1] p-8 rounded-full mb-6">
            <FontAwesome name="book" size={60} color="#8e94a8" />
          </View>
          <Text className="text-2xl font-serif font-bold mb-3 text-[#1a2333] text-center">
            Nog geen quizzen gespeeld
          </Text>
          <Text className="text-center text-[#5c687e] mb-10 leading-[24px] text-[16px]">
            Begin met een quiz om je geschiedenis te zien en je voortgang bij te houden.
          </Text>
          <TouchableOpacity
            className="bg-[#1a2333] w-full py-4 rounded-[20px] shadow-sm active:opacity-90"
            onPress={() => router.push('/(tabs)')}
          >
            <Text className="text-white font-bold text-center text-[17px]">Ontdek Quizzen</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={progress}
          renderItem={renderProgressItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1a2333" />
          }
        />
      )}
    </SafeAreaView>
  );
}