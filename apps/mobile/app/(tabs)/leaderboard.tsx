import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../components/AuthProvider';
import { API_BASE_URL } from '../../constants/api';

interface LeaderboardUser {
  _id: string;
  name: string;
  image?: string;
  totalPoints: number;
  quizzesPlayed: number;
  avgScore: number;
  streak: number;
  isPremium: boolean;
  recentActivity: boolean;
}

export default function LeaderboardScreen() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<'all' | 'week' | 'month'>('all');

  const fetchLeaderboard = async () => {
    try {
      setError(null);
      const response = await fetch(`${API_BASE_URL}/api/leaderboard?time=${timeFilter}`);
      
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(Array.isArray(data) ? data : []);
      } else {
        setError('Kon ranglijst niet laden.');
      }
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
      setError('Netwerkfout opgetreden.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [timeFilter]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLeaderboard();
  };

  const renderPodiumUser = (userData: LeaderboardUser, rank: 1 | 2 | 3) => {
    const config = {
      1: {
        height: 120,
        avatarSize: 70,
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-300',
        iconColor: '#f59e0b',
        icon: 'trophy',
      },
      2: {
        height: 100,
        avatarSize: 60,
        bgColor: 'bg-slate-50',
        borderColor: 'border-slate-300',
        iconColor: '#94a3b8',
        icon: 'star',
      },
      3: {
        height: 85,
        avatarSize: 55,
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-300',
        iconColor: '#ea580c',
        icon: 'star',
      },
    }[rank];

    return (
      <View className="items-center" style={{ flex: rank === 1 ? 1.2 : 1 }}>
        <View className="relative mb-3">
          <View 
            className={`rounded-full bg-white ${config.borderColor} border-2 overflow-hidden`}
            style={{ width: config.avatarSize, height: config.avatarSize }}
          >
            {userData.image ? (
              <Image 
                source={{ uri: userData.image }} 
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
            ) : (
              <View className="flex-1 items-center justify-center bg-[#dbe1ee]">
                <FontAwesome name="user" size={config.avatarSize * 0.45} color="#8e94a8" />
              </View>
            )}
          </View>
          <View className="absolute -top-2 -right-2 bg-white rounded-full p-1.5 shadow-md">
            <FontAwesome name={config.icon as any} size={16} color={config.iconColor} />
          </View>
          {userData.isPremium && (
            <View className="absolute -bottom-1 -left-1 bg-amber-400 rounded-full p-1 shadow-sm">
              <FontAwesome name="star" size={10} color="white" />
            </View>
          )}
        </View>
        
        <Text className="text-[13px] font-bold text-[#1a2333] text-center mb-1" numberOfLines={1}>
          {userData.name || 'Anoniem'}
        </Text>
        <Text className="text-[20px] font-black font-serif text-[#1a2333] mb-1">
          {userData.totalPoints.toLocaleString('nl-NL')}
        </Text>
        <Text className="text-[11px] text-[#8e94a8]">punten</Text>
        
        <View 
          className={`${config.bgColor} rounded-t-2xl mt-4 items-center justify-center w-full`}
          style={{ height: config.height }}
        >
          <Text className={`text-[32px] font-bold opacity-30 ${rank === 1 ? 'text-amber-600' : rank === 2 ? 'text-slate-500' : 'text-orange-600'}`}>
            {rank}
          </Text>
        </View>
      </View>
    );
  };

  const renderLeaderboardItem = ({ item, index }: { item: LeaderboardUser; index: number }) => {
    const rank = index + 1;
    const isTop10 = rank <= 10;
    
    return (
      <View className={`flex-row items-center py-4 px-4 border-b border-[#e4e7f1] ${isTop10 ? 'bg-blue-50/30' : ''}`}>
        <View className="w-10 items-center">
          <Text className={`text-[16px] font-bold ${isTop10 ? 'text-[#5b7dd9]' : 'text-[#8e94a8]'}`}>
            {rank}
          </Text>
        </View>
        
        <View className="flex-row flex-1 items-center gap-3">
          <View className="relative">
            <View className={`w-12 h-12 rounded-full overflow-hidden border-2 ${item.isPremium ? 'border-amber-400' : 'border-[#e4e7f1]'} bg-[#dbe1ee]`}>
              {item.image ? (
                <Image 
                  source={{ uri: item.image }} 
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                />
              ) : (
                <View className="flex-1 items-center justify-center">
                  <FontAwesome name="user" size={20} color="#8e94a8" />
                </View>
              )}
            </View>
            {item.recentActivity && (
              <View className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-white" />
            )}
          </View>
          
          <View className="flex-1">
            <View className="flex-row items-center gap-2">
              <Text className="text-[15px] font-semibold text-[#1a2333]" numberOfLines={1}>
                {item.name || 'Anonieme Speler'}
              </Text>
              {item.isPremium && (
                <View className="bg-amber-400 px-1.5 py-0.5 rounded flex-row items-center gap-0.5">
                  <FontAwesome name="star" size={8} color="white" />
                  <Text className="text-white text-[9px] font-bold">PRO</Text>
                </View>
              )}
            </View>
            <View className="flex-row items-center gap-3 mt-0.5">
              <Text className="text-[11px] text-[#8e94a8]">{item.quizzesPlayed} quizzen</Text>
              {item.streak > 0 && (
                <View className="flex-row items-center gap-1">
                  <Ionicons name="flame" size={12} color="#f5a623" />
                  <Text className="text-[11px] text-[#f5a623] font-medium">{item.streak}</Text>
                </View>
              )}
            </View>
          </View>
          
          <Text className="text-[18px] font-black font-serif text-[#1a2333]">
            {item.totalPoints.toLocaleString('nl-NL')}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-[#f8fafd]">
        <ActivityIndicator size="large" color="#1a2333" />
      </View>
    );
  }

  const podiumUsers = leaderboard.slice(0, 3);
  const tableUsers = leaderboard.slice(3);

  return (
    <SafeAreaView className="flex-1 bg-[#f8fafd]" edges={['top']}>
      <View className="px-5 pt-6 pb-4">
        <Text className="text-3xl font-serif font-bold text-[#1a2333] mb-2">Ranglijst</Text>
        <Text className="text-[#5c687e] text-[15px]">
          Top spelers van BijbelQuiz
        </Text>
      </View>

      <View className="px-5 pb-4 flex-row gap-2">
        {(['all', 'month', 'week'] as const).map((filter) => (
          <TouchableOpacity
            key={filter}
            onPress={() => setTimeFilter(filter)}
            className={`px-4 py-2 rounded-full ${
              timeFilter === filter 
                ? 'bg-[#1a2333]' 
                : 'bg-[#e4e7f1]'
            }`}
          >
            <Text className={`text-[13px] font-medium ${
              timeFilter === filter 
                ? 'text-white' 
                : 'text-[#5c687e]'
            }`}>
              {filter === 'all' ? 'Altijd' : filter === 'month' ? 'Maand' : 'Week'}
            </Text>
          </TouchableOpacity>
        ))}
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

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1a2333" />
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {podiumUsers.length >= 3 && (
          <View className="px-5 mb-6 mt-4">
            <View className="flex-row items-end justify-center gap-2">
              {podiumUsers[1] && renderPodiumUser(podiumUsers[1], 2)}
              {podiumUsers[0] && renderPodiumUser(podiumUsers[0], 1)}
              {podiumUsers[2] && renderPodiumUser(podiumUsers[2], 3)}
            </View>
          </View>
        )}

        {tableUsers.length > 0 && (
          <View className="mx-5 bg-white rounded-2xl border border-[#e4e7f1] overflow-hidden shadow-sm">
            <View className="bg-[#f0f2f5] px-4 py-3 border-b border-[#e4e7f1]">
              <Text className="text-[12px] font-bold text-[#5c687e] uppercase tracking-wider">
                Top {leaderboard.length} Spelers
              </Text>
            </View>
            <FlatList
              data={tableUsers}
              renderItem={renderLeaderboardItem}
              keyExtractor={(item) => item._id}
              scrollEnabled={false}
            />
          </View>
        )}

        {leaderboard.length === 0 && !loading && (
          <View className="flex-1 justify-center items-center px-8 py-20">
            <View className="bg-[#e4e7f1] p-8 rounded-full mb-6">
              <FontAwesome name="trophy" size={60} color="#8e94a8" />
            </View>
            <Text className="text-2xl font-serif font-bold mb-3 text-[#1a2333] text-center">
              Nog geen scores
            </Text>
            <Text className="text-center text-[#5c687e] leading-[24px] text-[16px]">
              Speel quizzen om in de ranglijst te verschijnen.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}