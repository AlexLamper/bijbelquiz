import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LibraryScreen() {
  return (
    <SafeAreaView className="flex-1 bg-[#f8fafd] justify-center items-center">
      <Text className="text-2xl font-serif text-[#1c223a]">Bibliotheek</Text>
    </SafeAreaView>
  );
}