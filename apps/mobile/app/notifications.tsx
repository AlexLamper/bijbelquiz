import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'streak' | 'achievement' | 'system' | 'quiz';
}

export default function NotificationsScreen() {
  const router = useRouter();
  
  // Dummy data for notifications
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: '1',
      title: 'Je mist bijna je streak!',
      message: 'Log in en voltooi vandaag nog een quiz om je 3-daagse streak te behouden.',
      time: '2 uur geleden',
      read: false,
      type: 'streak'
    },
    {
      id: '2',
      title: 'Nieuwe badge verdiend',
      message: 'Gefeliciteerd! Je hebt de "Genesis Expert" badge behaald.',
      time: 'Gisteren',
      read: true,
      type: 'achievement'
    },
    {
      id: '3',
      title: 'Nieuwe Quiz beschikbaar',
      message: 'Speel nu de nieuwe wekelijkse quiz: Koning David.',
      time: 'Vrijdag',
      read: true,
      type: 'quiz'
    }
  ]);

  const getIconForType = (type: string) => {
    switch (type) {
      case 'streak': return <FontAwesome5 name="fire" size={20} color="#ea580c" />;
      case 'achievement': return <FontAwesome5 name="medal" size={20} color="#C5A059" />;
      case 'quiz': return <FontAwesome5 name="book-open" size={20} color="#2563eb" />;
      default: return <FontAwesome5 name="bell" size={20} color="#9ca3af" />;
    }
  };

  const getBgForType = (type: string) => {
    switch (type) {
      case 'streak': return 'bg-orange-100';
      case 'achievement': return 'bg-amber-100';
      case 'quiz': return 'bg-blue-100';
      default: return 'bg-gray-100';
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-row items-center px-4 py-3 border-b border-gray-200 bg-white">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <Ionicons name="arrow-back" size={24} color="#121A2A" />
        </TouchableOpacity>
        <Text className="flex-1 text-center font-bold text-[#121A2A] text-lg mr-8">Notificaties</Text>
      </View>

      <ScrollView className="flex-1 px-4 py-4">
        {unreadCount > 0 && (
          <View className="mb-4">
            <Text className="text-gray-500 text-sm font-medium mb-3 ml-2">Nieuw ({unreadCount})</Text>
            {notifications.filter(n => !n.read).map(item => (
              <TouchableOpacity
                key={item.id}
                onPress={() => markAsRead(item.id)}
                className="bg-white p-4 rounded-2xl mb-3 shadow-sm border border-blue-100 flex-row"
              >
                <View className={`w-12 h-12 rounded-full ${getBgForType(item.type)} items-center justify-center mr-4`}>
                   {getIconForType(item.type)}
                </View>
                <View className="flex-1">
                  <Text className="font-bold text-[#121A2A] text-base mb-1">{item.title}</Text>
                  <Text className="text-gray-600 text-sm leading-5 mb-2">{item.message}</Text>
                  <Text className="text-blue-500 text-xs font-medium">{item.time}</Text>
                </View>
                <View className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-2" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View className="mb-8">
            <Text className="text-gray-500 text-sm font-medium mb-3 ml-2 mt-2">Eerder</Text>
            {notifications.filter(n => n.read).map(item => (
              <TouchableOpacity
                key={item.id}
                className="bg-white p-4 rounded-2xl mb-3 border border-gray-100 flex-row opacity-75"
              >
                <View className={`w-12 h-12 rounded-full ${getBgForType(item.type)} items-center justify-center mr-4`}>
                   {getIconForType(item.type)}
                </View>
                <View className="flex-1">
                  <Text className="font-bold text-[#121A2A] text-base mb-1">{item.title}</Text>
                  <Text className="text-gray-500 text-sm leading-5 mb-2">{item.message}</Text>
                  <Text className="text-gray-400 text-xs font-medium">{item.time}</Text>
                </View>
              </TouchableOpacity>
            ))}
            {notifications.length === 0 && (
                <View className="items-center justify-center py-20">
                    <Ionicons name="notifications-off-outline" size={60} color="#d1d5db" />
                    <Text className="text-gray-400 mt-4 text-center">Je hebt geen notificaties.</Text>
                </View>
            )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
