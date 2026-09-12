import { useRouter } from 'expo-router';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';

import { ALERTS, AlertCard } from '@/components/alert-card';
import { ScreenHeader } from '@/components/screen-header';
import { TabBar } from '@/components/tab-bar';

export default function DashboardScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-slate-100">
      <ScreenHeader
        title="Dashboard"
        subtitle="Sri Lanka Police • Stay Safe"
        right={
          <Pressable
            onPress={() => router.push('/account')}
            className="h-11 w-11 rounded-full bg-white items-center justify-center border-2 border-blue-300"
            accessibilityRole="button"
            accessibilityLabel="Open profile"
          >
            <Image
              source={require('@/assets/images/police.png')}
              className="h-8 w-8"
              resizeMode="contain"
            />
          </Pressable>
        }
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 24, paddingTop: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-4">
          <View className="bg-red-600 rounded-2xl p-4 flex-row items-center justify-between">
            <View>
              <Text className="text-white/90 text-[11px] font-semibold uppercase tracking-widest">
                Emergency
              </Text>
              <Text className="text-white text-3xl font-extrabold">119</Text>
            </View>
            <Pressable
              className="bg-white rounded-full px-6 py-2.5"
              accessibilityRole="button"
            >
              <Text className="text-red-600 font-bold">Call</Text>
            </Pressable>
          </View>
        </View>

        <View className="px-4 mt-6">
          <Text className="text-slate-900 text-lg font-bold mb-3">
            Recent Alerts
          </Text>
          {ALERTS.map(item => (
            <AlertCard key={item.id} item={item} />
          ))}
        </View>

        <View className="px-4 pt-4">
          <Pressable
            className="bg-police-navy rounded-xl py-4 items-center shadow-sm"
            accessibilityRole="button"
          >
            <Text className="text-white font-bold text-base">
              Report an Incident
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      <TabBar active="dashboard" />
    </View>
  );
}