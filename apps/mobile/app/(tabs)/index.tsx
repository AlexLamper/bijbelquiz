import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, TextInput, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { useAuth } from '../../components/AuthProvider';
import { API_BASE_URL } from '../../constants/api';
import { getQuizImage } from '../../constants/quizImages';

const PRIMARY_NAVY = '#121A2A';
const GOLD_ACCENT = '#C5A059';

interface Category {
  _id: string;
  title: string;
  slug: string;
}

interface Quiz {
  _id: string;
  title: string;
  description: string;
  difficulty: string;
  isPremium?: boolean;
  imageUrl?: string;
  questions?: any[];
  category?: { title: string };
  categoryId?: { title: string; slug: string; _id: string } | string;
  slug?: string;
}

export default function HomeScreen() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const router = useRouter();
  const { isPremium, user } = useAuth();

  const fetchQuizzes = async () => {
    try {
      setError(null);
      const [quizResponse, catResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/quizzes`),
        fetch(`${API_BASE_URL}/api/categories`)
      ]);

      if (!quizResponse.ok) {
        throw new Error('Failed to fetch quizzes');
      }

      const data = await quizResponse.json();
      const quizzesArray = Array.isArray(data) ? data : data.data || [];
      const normalizedQuizzes = quizzesArray.map((q: any) => ({
        ...q,
        _id: q._id?.$oid || q._id,
        categoryId: q.categoryId?.$oid || q.categoryId,
      }));
      setQuizzes(normalizedQuizzes);

      if (catResponse.ok) {
        const catData = await catResponse.json();
        setCategories(Array.isArray(catData) ? catData : []);
      }
    } catch (err: any) {
      console.error('Failed to fetch quizzes:', err);
      setError('Kon data niet laden. Controleer je internetverbinding.');
      // Fallback
      try {
        const rawData = require('../../assets/data/quizzes.json');
        const data = rawData.map((q: any) => ({
          ...q,
          _id: q._id?.$oid || q._id,
          categoryId: q.categoryId?.$oid || q.categoryId,
        }));
        setQuizzes(Array.isArray(data) ? data : []);
        setError(null);
      } catch (fallbackErr) {
        console.error('Fallback also failed:', fallbackErr);
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

  const filteredQuizzes = quizzes.filter(q => {
    const matchesSearch = q.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (q.description && q.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    let matchesCategory = true;
    if (selectedCategory !== 'all') {
      const catSlug = typeof q.categoryId === 'object' ? q.categoryId?.slug : '';
      const catId = typeof q.categoryId === 'object' ? q.categoryId?._id : q.categoryId;
      const selectedCatObj = categories.find(c => c.slug === selectedCategory);
      
      matchesCategory = Boolean(catSlug === selectedCategory || catId === selectedCategory || (selectedCatObj && catId === selectedCatObj._id));
    }

    return matchesSearch && matchesCategory;
  });

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
            router.push('/paywall');
          } else {
            router.push(`/quiz/${item._id}`);
          }
        }}
        activeOpacity={0.8}
      >
        <View className="h-[140px] bg-[#F3F4F6] rounded-2xl mb-3 overflow-hidden border border-slate-200 shadow-sm relative">
            {getQuizImage(item.imageUrl) ? (
              <>
                <Image
                  source={getQuizImage(item.imageUrl)}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                  transition={200}
                />
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.12)' }} />
              </>
            ) : (
              <>
                <View className="absolute inset-0 bg-[#121A2A] opacity-10"></View>
                <View className="absolute inset-0 justify-center items-center">
                  <FontAwesome name="image" size={30} color="#9CA3AF" />
                </View>
              </>
            )}

            {item.isPremium && (
              <View className="absolute top-2 right-2 bg-[#C5A059] px-2 py-1 rounded-md flex-row items-center gap-1 shadow-sm">
                <FontAwesome name="star" size={10} color="white" />
                <Text className="text-white text-[10px] font-bold uppercase tracking-wider">PREMIUM</Text>
              </View>
            )}
        </View>
        
        <Text className="text-[16px] font-bold text-[#121A2A] mb-1 leading-tight" numberOfLines={2}>{item.title}</Text>
        
        <View className="flex-row items-center justify-between">
            <Text className="text-[12px] text-[#6B7280] font-medium bg-[#F3F4F6] px-2 py-1 rounded-md">
               {item.difficulty === 'hard' ? 'Moeilijk' : item.difficulty === 'medium' ? 'Gemiddeld' : 'Makkelijk'}
            </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-[#F8FAFC]">
        <ActivityIndicator size="large" color="#121A2A" />
      </View>
    );
  }

  const themeImages = [
    '/images/quizzes/img1.png', 
    '/images/quizzes/img2.png', 
    '/images/quizzes/img3.png', 
    '/images/quizzes/img4.png',
    '/images/quizzes/img5.png',
    '/images/quizzes/img6.png',
    '/images/quizzes/img7.png',
    '/images/quizzes/img8.png'
  ];

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]" edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#121A2A" />
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View className="px-5">
            {/* Logo Header */}
            <View className="flex-row items-center justify-center mt-2 mb-6">
              <Image 
                source={require('../../assets/images/logo-dark.png')} 
                style={{ width: 40, height: 40 }}
                contentFit="contain"
              />
              <Text className="ml-3 text-3xl font-serif font-bold text-[#121A2A] mt-1.5">Bijbelquiz</Text>
            </View>

            {/* Search Bar */}
            <View className="bg-[#F3F4F6] rounded-xl flex-row items-center px-4 py-3 mb-6">
              <FontAwesome name="search" size={16} color="#6B7280" className="mr-3" />
              <TextInput 
                placeholder="Zoeken in quizzen of onderwerpen"
                placeholderTextColor="#6B7280"
                className="flex-1 text-[15px] font-medium text-[#121A2A]"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} className="p-2 -mr-2 ml-1">
                  <FontAwesome name="times-circle" size={16} color="#6B7280" />
                </TouchableOpacity>
              )}
            </View>

            {/* Category Filters */}
            <View className="-mx-5 mb-8">
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }} className="flex-row">
                <TouchableOpacity 
                  className={`rounded-full px-5 py-2 mr-3 ${selectedCategory === 'all' ? 'bg-[#121A2A]' : 'bg-[#E5E7EB]'}`}
                  onPress={() => setSelectedCategory('all')}
                >
                  <Text className={`font-medium text-[13px] ${selectedCategory === 'all' ? 'text-white' : 'text-[#6B7280]'}`}>Alles</Text>
                </TouchableOpacity>
                {categories.map((cat, idx) => (
                  <TouchableOpacity 
                    key={cat._id || idx} 
                    className={`rounded-full px-5 py-2 mr-3 ${selectedCategory === cat.slug ? 'bg-[#121A2A]' : 'bg-[#E5E7EB]'}`}
                    onPress={() => setSelectedCategory(cat.slug)}
                  >
                    <Text className={`font-medium text-[13px] ${selectedCategory === cat.slug ? 'text-white' : 'text-[#6B7280]'}`}>{cat.title}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {error ? (
              <View className="mt-4 p-4 bg-red-50 border border-red-100 rounded-xl flex-row items-center gap-3 mb-4">
                <FontAwesome name="exclamation-triangle" size={16} color="#ef4444" />
                <Text className="text-red-600 flex-1 font-medium">{error}</Text>
                <TouchableOpacity onPress={onRefresh}>
                    <Text className="text-red-700 font-bold">Opnieuw</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-[19px] font-semibold text-[#121A2A]">Aanbevolen voor jou</Text>
            </View>
        </View>

        {filteredQuizzes.length > 0 ? (
            <FlatList
              data={filteredQuizzes.slice(0, 5)}
              renderItem={renderQuizItem}
              keyExtractor={(item) => item._id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 10 }}
            />
        ) : (
            <View className="px-5 items-center justify-center py-6">
                <Text className="text-[#6B7280]">Geen quizzen gevonden in deze categorie.</Text>
            </View>
        )}

        <View className="px-5 mt-4 mb-4 flex-row items-center justify-between">
            <Text className="text-[19px] font-semibold text-[#121A2A]">Populaire quizzen</Text>
        </View>
        
        {filteredQuizzes.length > 0 ? (
            <FlatList
              data={[...filteredQuizzes].reverse().slice(0, 5)}
              renderItem={renderQuizItem}
              keyExtractor={(item) => item._id + '-pop'}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 10 }}
            />
        ) : (
            <View className="px-5 items-center justify-center py-6">
                <Text className="text-[#6B7280]">Geen quizzen beschikbaar.</Text>
            </View>
        )}

        <View className="px-5 mt-6 mb-4 flex-row items-center justify-between">
          <Text className="text-[19px] font-semibold text-[#121A2A]">Thema's</Text>
          <View className="flex-row gap-1">
             <View className="w-1.5 h-1.5 bg-[#121A2A] rounded-full"></View>
             <View className="w-1.5 h-1.5 bg-[#D1D5DB] rounded-full"></View>
             <View className="w-1.5 h-1.5 bg-[#D1D5DB] rounded-full"></View>
          </View>
        </View>
        
        <View className="px-5">
        <View className="gap-4">
          {categories.slice(0, 5).map((theme, index) => {
            const staticImg = themeImages[index % themeImages.length];
            return (
              <TouchableOpacity 
                key={theme._id || index}
                onPress={() => router.push({ pathname: '/library', params: { category: theme.slug } })}
                activeOpacity={0.8}
              >
                <View className="h-[100px] bg-[#F3F4F6] rounded-2xl w-full border border-slate-200 overflow-hidden relative justify-center">
                  {getQuizImage(staticImg) ? (
                    <Image
                      source={getQuizImage(staticImg)}
                      style={{ width: '100%', height: '100%', position: 'absolute' }}
                      resizeMode="cover"
                    />
                  ) : null}
                  <View className="absolute inset-0 bg-black/50 justify-center p-4">
                    <Text className="text-white font-bold text-[18px] text-center">{theme.title}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
