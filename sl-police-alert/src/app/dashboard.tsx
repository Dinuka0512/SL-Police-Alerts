import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from 'react-native';

import { AlertCard, AlertItem } from '@/components/alert-card';
import { ScreenHeader } from '@/components/screen-header';
import { TabBar } from '@/components/tab-bar';
import { api, RawMessage } from '@/lib/api';
import { timeAgo } from '@/lib/format';
import { useAuth } from '@/store/auth';

function toAlert(message: RawMessage): AlertItem {
  const level = message.priority?.toLowerCase();
  return {
    id: String(message.m_id),
    level: level === 'high' || level === 'medium' || level === 'low' ? level : 'low',
    title: message.title,
    location: message.sentBy || 'Sri Lanka Police',
    time: timeAgo(message.date, message.time),
  };
}

export default function DashboardScreen() {
  const router = useRouter();
  const { token } = useAuth();

  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      router.replace('/login');
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const messages = await api.getMessages();
        if (!cancelled) setAlerts(messages.map(toAlert));
      } catch (err) {
        if (err instanceof Error && err.message === 'Invalid or expired token') {
          router.replace('/login');
          return;
        }
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load alerts');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, router]);

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
          {isLoading && <ActivityIndicator className="py-8" color="#1D4ED8" />}
          {!isLoading && error && (
            <Text className="text-red-600 text-sm text-center py-8">{error}</Text>
          )}
          {!isLoading && !error && alerts.length === 0 && (
            <Text className="text-slate-400 text-sm text-center py-8">
              No alerts yet.
            </Text>
          )}
          {alerts.map(item => (
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