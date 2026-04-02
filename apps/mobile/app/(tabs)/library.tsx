import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Image, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { useAuth } from '../../components/AuthProvider';
import { getQuizImage } from '../../constants/quizImages';
import { API_BASE_URL } from '../../constants/api';

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

export default function LibraryScreen() {
  const router = useRouter();
  const { category: initialCategory } = useLocalSearchParams();
  const { isPremium } = useAuth();
  
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    try {
      setError(null);
      const [quizResponse, catResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/quizzes`),
        fetch(`${API_BASE_URL}/api/categories`)
      ]);

      if (quizResponse.ok) {
        const data = await quizResponse.json();
        const quizzesArray = Array.isArray(data) ? data : data.data || [];
        setQuizzes(quizzesArray);
      }

      if (catResponse.ok) {
        const catData = await catResponse.json();
        setCategories(Array.isArray(catData) ? catData : []);
      }
    } catch (err: any) {
      console.error('Failed to fetch library data:', err);
      setError('Kon data niet laden.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (initialCategory && typeof initialCategory === 'string') {
      setSelectedCategory(initialCategory);
    }
  }, [initialCategory]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const filteredQuizzes = quizzes.filter(q => {
    const matchesSearch = q.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (q.description && q.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    let matchesCategory = true;
    if (selectedCategory !== 'all') {
      const catSlug = typeof q.categoryId === 'object' ? q.categoryId?.slug : '';
      // We might need to handle ID based filtering if slug is not available
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
        className="mb-4 bg-white rounded-2xl border border-[#e4e7f1] overflow-hidden shadow-sm flex-row h-[120px]"
        onPress={() => {
          if (isLocked) {
            alert("Dit is een Premium quiz.");
          } else {
            router.push(`/quiz/${item._id}`);
          }
        }}
        activeOpacity={0.8}
      >
        <View className="w-[120px] bg-[#dbe1ee] relative h-full">
            {getQuizImage(item.imageUrl) ? (
              <>
                <Image
                  source={getQuizImage(item.imageUrl)}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                />
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.12)' }} />
              </>
            ) : (
              <View className="absolute inset-0 justify-center items-center">
                <FontAwesome name="image" size={30} color="#bac6da" />
              </View>
            )}
        </View>
        
        <View className="flex-1 p-3 justify-between">
          <View>
            <Text className="text-[16px] font-bold text-[#1c223a] mb-1 leading-tight" numberOfLines={2}>{item.title}</Text>
            <Text className="text-[12px] text-[#8e94a8]" numberOfLines={1}>{categoryName}</Text>
          </View>
          
          <View className="flex-row items-center justify-between">
             <Text className="text-[12px] text-[#5c687e] font-medium bg-[#f0f2f5] px-2 py-1 rounded-md">
               {item.difficulty === 'hard' ? 'Moeilijk' : item.difficulty === 'medium' ? 'Gemiddeld' : 'Makkelijk'}
             </Text>
             
             {item.isPremium && (
              <View className="bg-amber-500 px-2 py-1 rounded-md flex-row items-center gap-1 shadow-sm">
                <FontAwesome name="star" size={10} color="white" />
                <Text className="text-white text-[10px] font-bold uppercase tracking-wider">PRO</Text>
              </View>
             )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f8fafd]" edges={['top']}>
      <View className="px-5 pt-6 pb-2">
        <Text className="text-3xl font-serif font-bold text-[#1a2333] mb-2">Quizzen</Text>
        <Text className="text-[#5c687e] text-[15px] mb-4">
          Ontdek alle beschikbare Bijbelquizzen en test je kennis.
        </Text>
      </View>

      <View className="px-5 mb-4">
        <View className="bg-[#f0f2f5] rounded-xl flex-row items-center px-4 py-3">
          <FontAwesome name="search" size={16} color="#8e94a8" className="mr-3" />
          <TextInput 
            placeholder="Zoeken in quizzen..."
            placeholderTextColor="#8e94a8"
            className="flex-1 text-[15px] font-medium text-[#1c223a]"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} className="p-2 -mr-2 ml-1">
              <FontAwesome name="times-circle" size={16} color="#8e94a8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category Filter */}
      <View className="mb-4">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }} className="flex-row">
          <TouchableOpacity 
            className={`rounded-full px-5 py-2 mr-3 ${selectedCategory === 'all' ? 'bg-[#1a2333]' : 'bg-[#e4e7f1]'}`}
            onPress={() => setSelectedCategory('all')}
          >
            <Text className={`font-medium text-[13px] ${selectedCategory === 'all' ? 'text-white' : 'text-[#3c4257]'}`}>Alles</Text>
          </TouchableOpacity>
          {categories.map((cat, idx) => (
            <TouchableOpacity 
              key={cat._id || idx} 
              className={`rounded-full px-5 py-2 mr-3 ${selectedCategory === cat.slug ? 'bg-[#1a2333]' : 'bg-[#e4e7f1]'}`}
              onPress={() => setSelectedCategory(cat.slug)}
            >
              <Text className={`font-medium text-[13px] ${selectedCategory === cat.slug ? 'text-white' : 'text-[#3c4257]'}`}>{cat.title}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {!isPremium && (
        <View className="mx-5 mb-4 bg-[#eaf0fc] p-4 rounded-xl border border-[#dfe8fa]">
           <View className="flex-row items-center mb-2">
             <FontAwesome name="star" size={16} color="#f59e0b" className="mr-2" />
             <Text className="font-bold text-[#1a2333]">Premium</Text>
           </View>
           <Text className="text-[#5c687e] text-[13px] mb-3">Ontgrendel alle quizzen inclusief diepere theologie en uitgebreide uitleg!</Text>
           <TouchableOpacity 
              className="bg-[#1a2333] py-2 rounded-lg items-center"
              onPress={() => router.push('/modal')}
           >
              <Text className="text-white font-bold text-[13px]">Probeer Premium</Text>
           </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#1a2333" />
        </View>
      ) : (
        <FlatList
          data={filteredQuizzes}
          renderItem={renderQuizItem}
          keyExtractor={(item) => item._id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1a2333" />}
          ListEmptyComponent={
            <View className="items-center justify-center py-10">
              <FontAwesome name="search" size={40} color="#bac6da" className="mb-4" />
              <Text className="text-[#8e94a8] text-[15px] font-medium text-center">Niks gevonden voor je zoekopdracht of filter.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
