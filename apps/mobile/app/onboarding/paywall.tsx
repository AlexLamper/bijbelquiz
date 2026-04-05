import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Alert, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import Purchases from 'react-native-purchases';
import RevenueCatUI from 'react-native-purchases-ui';
import { useAuth } from '../../components/AuthProvider';
import { X } from 'lucide-react-native';

const PRIMARY_NAVY = '#121A2A';
const GOLD_ACCENT = '#C5A059';

export default function PaywallScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      // Just waiting a tick to ensure RevenueCat is initialized
      const configured = await Purchases.isConfigured();
      if (configured) {
        setIsReady(true);
      } else {
        // Fallback for dev 
        setIsReady(true);
      }
    };
    init();
  }, []);

  if (!isReady) {
    return (
      <View className="flex-1 justify-center items-center" style={{ backgroundColor: PRIMARY_NAVY }}>
        <ActivityIndicator size="large" color={GOLD_ACCENT} />
      </View>
    );
  }

  return (
    <View className="flex-1">
      {/* Small header to dismiss or open customer center */}
      <View className="absolute top-12 left-4 z-50 rounded-full bg-black/30 p-2">
        <TouchableOpacity onPress={() => router.back()}>
          <X color="white" size={24} />
        </TouchableOpacity>
      </View>
      
      {/* RevenueCat Paywall component */}
      <RevenueCatUI.Paywall 
        style={{ flex: 1 }}
        onPurchaseCompleted={({ customerInfo }) => {
          if (customerInfo.entitlements.active['BijbelQuiz Premium'] !== undefined) {
             Alert.alert("Succes!", "Welkom bij BijbelQuiz Premium!");
             router.back();
          } else {
            console.warn("Purchase made, but 'BijbelQuiz Premium' not active");
          }
        }}
        onRestoreCompleted={({ customerInfo }) => {
          if (customerInfo.entitlements.active['BijbelQuiz Premium'] !== undefined) {
            Alert.alert("Hersteld", "Je Premium is succesvol hersteld.");
            router.back();
          } else {
            Alert.alert("Aankopen herstellen", "Geen actieve Premium-aankopen gevonden.");
          }
        }}
      />
    </View>
  );
}
