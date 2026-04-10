import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, ScrollView, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../components/AuthProvider';
import { API_BASE_URL } from '../../constants/api';

interface LeaderboardUser {
  _id: string;
  name: string;
  image?: string;
  totalPoints: number;
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

  if (loading && !refreshing) {
    return (
      <View className="flex-1 justify-center items-center bg-[#f8fafc]">
        <ActivityIndicator size="large" color="#121A2A" />
      </View>
    );
  }

  const PRIMARY_DARK = '#121A2A';
  const ACCENT_GOLD = '#C5A059';

  const podiumUsers = leaderboard.slice(0, 3);
  const tableUsers = leaderboard.slice(3, 50);

  return (
    <View className="flex-1 bg-gray-50">
      {/* Podium Section */}
      <View className="pt-[100px] pb-8 px-6 bg-[#121A2A]">
        <Text className="text-3xl font-bold text-center text-white mb-10">Ranglijst</Text>
        
        <View className="flex-row justify-center items-end h-32 w-full px-2">
          {/* 2nd Place */}
          {podiumUsers[1] ? (
             <View className="items-center flex-1">
               <View className="relative mb-3">
                 {podiumUsers[1].image ? (
                   <Image source={{ uri: podiumUsers[1].image }} className="w-14 h-14 rounded-full border-2 border-gray-400" />
                 ) : (
                   <View className="w-14 h-14 rounded-full border-2 border-gray-400 bg-gray-600 justify-center items-center">
                     <FontAwesome name="user" size={24} color="rgba(255,255,255,0.5)" />
                   </View>
                 )}
                 <View className="absolute -bottom-2 left-0 right-0 items-center">
                   <View className="bg-gray-400 px-2 rounded-full justify-center">
                     <Text className="text-white text-[10px] font-bold text-center">2</Text>
                   </View>
                 </View>
               </View>
               <Text className="text-white text-xs font-bold pt-1">{podiumUsers[1].name || 'Speler'}</Text>
               <Text className="text-white/70 text-[10px]">{podiumUsers[1].totalPoints} XP</Text>
             </View>
          ) : (
             <View className="flex-1" />
          )}

          {/* 1st Place */}
          {podiumUsers[0] ? (
             <View className="items-center z-10 flex-[1.2]">
               <View className="relative mb-3 h-20 items-center">
                 <FontAwesome name="flash" size={20} color={ACCENT_GOLD} style={{ position: 'absolute', top: -20 }} />
                 {podiumUsers[0].image ? (
                   <Image source={{ uri: podiumUsers[0].image }} className="w-20 h-20 rounded-full border-4 border-[#C5A059]" />
                 ) : (
                   <View className="w-20 h-20 rounded-full border-4 border-[#C5A059] bg-gray-700 justify-center items-center">
                     <FontAwesome name="user" size={32} color="rgba(255,255,255,0.5)" />
                   </View>
                 )}
                 <View className="absolute -bottom-2 left-0 right-0 items-center">
                   <View className="bg-[#C5A059] px-3 py-0.5 rounded-full justify-center">
                     <Text className="text-white text-xs font-bold text-center">1</Text>
                   </View>
                 </View>
               </View>
               <Text className="text-white text-sm font-bold pt-2 text-center" numberOfLines={1}>{podiumUsers[0].name || 'Speler'}</Text>
               <Text className="text-white/70 text-xs">{podiumUsers[0].totalPoints} XP</Text>
             </View>
          ) : (
             <View className="flex-[1.2]" />
          )}

          {/* 3rd Place */}
          {podiumUsers[2] ? (
             <View className="items-center flex-1">
               <View className="relative mb-3">
                 {podiumUsers[2].image ? (
                   <Image source={{ uri: podiumUsers[2].image }} className="w-14 h-14 rounded-full border-2 border-amber-700" />
                 ) : (
                   <View className="w-14 h-14 rounded-full border-2 border-amber-700 bg-gray-600 justify-center items-center">
                     <FontAwesome name="user" size={24} color="rgba(255,255,255,0.5)" />
                   </View>
                 )}
                 <View className="absolute -bottom-2 left-0 right-0 items-center">
                   <View className="bg-amber-700 px-2 rounded-full justify-center">
                     <Text className="text-white text-[10px] font-bold text-center">3</Text>
                   </View>
                 </View>
               </View>
               <Text className="text-white text-xs font-bold pt-1">{podiumUsers[2].name || 'Speler'}</Text>
               <Text className="text-white/70 text-[10px]">{podiumUsers[2].totalPoints} XP</Text>
             </View>
          ) : (
             <View className="flex-1" />
          )}
        </View>
      </View>

      {/* Ranking List */}
      <ScrollView 
        className="flex-1 px-6 pt-4 space-y-3 pb-24"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {tableUsers.map((item, index) => {
           const rank = index + 4;
           const isMe = user?.id === item._id;

           return (
             <View 
               key={item._id} 
               className={`flex-row items-center bg-white p-4 rounded-xl border mb-3 ${isMe ? 'border-[#C5A059]' : 'border-gray-100'}`}
             >
               <Text className={`w-6 font-bold ${isMe ? 'text-[#121A2A]' : 'text-gray-400'}`}>{rank}</Text>
               
               {item.image ? (
                   <Image source={{ uri: item.image }} className="w-10 h-10 rounded-full bg-gray-200 ml-2" />
               ) : (
                   <View className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center ml-2">
                     <FontAwesome name="user" size={20} color="#9ca3af" />
                   </View>
               )}
               
               <View className="flex-1 ml-4 justify-center">
                 <Text className="text-sm font-bold text-[#121A2A]">
                   {item.name || 'Speler'}{isMe ? ' (Jij)' : ''}
                 </Text>
                 <Text className="text-[10px] text-gray-400 mt-1">{item.totalPoints} XP</Text>
               </View>
               
               <Ionicons name="chevron-forward" size={20} color="#e5e7eb" />
             </View>
           );
        })}

        {tableUsers.length === 0 && (
          <View className="py-10 items-center">
            <Text className="text-gray-400 text-sm font-medium">
              Geen spelers voor deze periode.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
