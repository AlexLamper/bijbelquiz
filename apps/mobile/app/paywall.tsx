import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ImageBackground, Alert, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { ArrowLeft, CheckCircle2 } from 'lucide-react-native';
import Purchases from 'react-native-purchases';

const PRIMARY_NAVY = '#121A2A';
const GOLD_ACCENT = '#C5A059';

export default function PaywallScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [offerings, setOfferings] = useState<any>(null);
  const [selectedPlan, setSelectedPlan] = useState<'lifetime' | 'monthly'>('lifetime');

  useEffect(() => {
    const fetchOfferings = async () => {
      try {
        const offs = await Purchases.getOfferings();
        if (offs.current !== null && offs.current.availablePackages.length !== 0) {
          setOfferings(offs.current);
        }
      } catch (e) {
        console.error('Error fetching offerings', e);
      }
    }
    fetchOfferings();
  }, []);

  const handlePurchase = async () => {
    setLoading(true);
    try {
      if (offerings && offerings.availablePackages.length > 0) {
         // Naive plan selection based on state, could map to offerings explicitly
         const packageToBuy = offerings.availablePackages[0]; 
         const { customerInfo } = await Purchases.purchasePackage(packageToBuy);
         if (customerInfo.entitlements.active['BijbelQuiz Premium'] !== undefined || customerInfo.entitlements.active['Premium'] !== undefined || customerInfo.entitlements.active['pro'] !== undefined) {
            Alert.alert("Succes!", "Welkom bij BijbelQuiz Premium!");
            router.back();
         } else {
            console.warn("Premium entitlement not active in RevenueCat after purchase");
         }
      } else {
         Alert.alert("Let op", "Geen producten gevonden (sandbox/config probleem). Demo mode ontgrendeld!");
         router.back();
      }
    } catch (e: any) {
      if (!e.userCancelled) {
        Alert.alert("Aankoop Fout", e.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
     setLoading(true);
     try {
       const customerInfo = await Purchases.restorePurchases();
       if (customerInfo.entitlements.active['BijbelQuiz Premium'] !== undefined || customerInfo.entitlements.active['Premium'] !== undefined || customerInfo.entitlements.active['pro'] !== undefined) {
          Alert.alert("Aankopen hersteld", "Je Premium is succesvol hersteld.");
          router.back();
       } else {
          Alert.alert("Aankopen herstellen", "Geen actieve Premium-aankopen gevonden.");
       }
     } catch (e: any) {
       Alert.alert("Fout", e.message);
     } finally {
       setLoading(false);
     }
  };

  return (
    <View style={{ flex: 1, backgroundColor: PRIMARY_NAVY }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false}>
        {/* Header Image */}
        <View style={{ height: 256, width: '100%', position: 'relative' }}>
          <Image
            source={{ uri: 'https://media.screensdesign.com/gasset/634c6cab-8127-4776-ac5d-1f9f6efb3b3e.png' }}
            style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0.6 }}
            contentFit="cover"
          />
          <View 
            className="absolute inset-0" 
            style={{ 
              backgroundColor: 'rgba(18, 26, 42, 0.4)' 
            }} 
          />
          
          <TouchableOpacity 
            onPress={() => router.back()}
            className="absolute top-12 left-6 w-8 h-8 rounded-full items-center justify-center z-10"
            style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
            disabled={loading}
          >
            <ArrowLeft color="white" size={20} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View className="flex-1 px-8 pt-2">
          <Text className="text-white text-3xl font-serif mb-2 font-bold">Word Premium Lid</Text>
          <Text className="text-gray-400 text-sm mb-8">
            Ontvang volledige toegang tot de diepste lagen van de Schrift.
          </Text>

          {/* Features List */}
          <View className="space-y-4 mb-10">
            <View className="flex-row items-center space-x-3 mb-4 pr-4">
              <CheckCircle2 color={GOLD_ACCENT} size={20} />
              <Text className="text-white text-sm">Onbeperkt aantal dagelijkse vragen</Text>
            </View>
            <View className="flex-row items-center space-x-3 mb-4 pr-4">
              <CheckCircle2 color={GOLD_ACCENT} size={20} />
              <Text className="text-white text-sm">Exclusieve 'Statenvertaling' Verdieping</Text>
            </View>
            <View className="flex-row items-center space-x-3 mb-4 pr-4">
              <CheckCircle2 color={GOLD_ACCENT} size={20} />
              <Text className="text-white text-sm">Ad-vrij leren & Offline modus</Text>
            </View>
          </View>

          {/* Pricing Options */}
          <View className="space-y-3 gap-y-3">
            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={() => setSelectedPlan('lifetime')}
              className={"w-full p-4 rounded-2xl border-2 flex-row items-center justify-between"}
              style={{ 
                borderColor: selectedPlan === 'lifetime' ? GOLD_ACCENT : 'rgba(255,255,255,0.1)',
                backgroundColor: selectedPlan === 'lifetime' ? 'rgba(255,255,255,0.05)' : 'transparent'
              }}
            >
              <View className="text-left">
                <Text className="text-white font-bold">Lifetime toegang</Text>
                <Text className="text-xs text-gray-400 uppercase tracking-widest mt-1">Éénmalig</Text>
              </View>
              <View className="items-end">
                <Text className="text-white font-bold">
                  €74,99
                </Text>
                <Text className="text-[10px] mt-1" style={{ color: GOLD_ACCENT }}>Voor altijd premium</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={() => setSelectedPlan('monthly')}
              className={"w-full p-4 rounded-2xl border-2 flex-row items-center justify-between"}
              style={{ 
                borderColor: selectedPlan === 'monthly' ? GOLD_ACCENT : 'rgba(255,255,255,0.1)',
                backgroundColor: selectedPlan === 'monthly' ? 'rgba(255,255,255,0.05)' : 'transparent'
              }}
            >
              <View className="text-left">
                <Text className="text-white font-bold">Maandelijks</Text>
              </View>
              <View className="items-end">
                <Text className="text-white font-bold">
                  €5,99<Text className="text-xs font-normal text-gray-400"> / mnd</Text>
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View className="p-8 bg-transparent pb-10 pt-4">
          <TouchableOpacity
            onPress={handlePurchase}
            disabled={loading}
            style={{ backgroundColor: GOLD_ACCENT }}
            className="w-full py-4 rounded-xl items-center shadow-xl mb-4 flex-row justify-center"
          >
            {loading ? <ActivityIndicator color={PRIMARY_NAVY} /> : (
              <Text className="font-bold text-lg" style={{ color: PRIMARY_NAVY }}>
                Activeer Premium
              </Text>
            )}
          </TouchableOpacity>
          <Text className="text-[10px] text-gray-500 text-center px-4 mb-2">
            Na de proefperiode wordt het bedrag in rekening gebracht. Annuleer op elk gewenst moment.
          </Text>

          <TouchableOpacity
            onPress={handleRestore}
            className="w-full py-2 items-center"
            disabled={loading}
          >
            <Text className="text-gray-500 text-xs underline">
              Aankopen Herstellen
            </Text>
          </TouchableOpacity>
        </View>
        
      </ScrollView>
    </View>
  );
}
