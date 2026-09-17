import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/screen-header';
import { formatDate } from '@/lib/format';
import { messageService } from '@/services';
import { useAuth } from '@/store/auth';
import type { AlertPriority, Message } from '@/types';

const PRIORITY_META: Record<
  AlertPriority,
  { label: string; cls: string }
> = {
  High: { label: 'HIGH', cls: 'bg-red-600' },
  Medium: { label: 'MEDIUM', cls: 'bg-amber-500' },
  Low: { label: 'LOW', cls: 'bg-emerald-600' },
};

export default function MessageDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();

  const [message, setMessage] = useState<Message | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      router.replace('/login');
      return;
    }

    if (!id) return;

    let cancelled = false;
    (async () => {
      try {
        const data = await messageService.findById(id);
        if (!cancelled) setMessage(data);
      } catch (err) {
        if (err instanceof Error && err.message === 'Invalid or expired token') {
          router.replace('/login');
          return;
        }
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load message');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, id, router]);

  const hasImage = Boolean(message?.image);

  return (
    <View className="flex-1 bg-white">
      <ScreenHeader title="Message Details" subtitle="Full news broadcast" />

      {isLoading && <ActivityIndicator className="py-10" color="#1D4ED8" />}
      {!isLoading && error && (
        <Text className="text-red-600 text-sm text-center py-10">{error}</Text>
      )}

      {!isLoading && !error && message && (
        <>
          <Pressable
            onPress={() => router.back()}
            className="absolute top-0 left-4 h-10 w-10 rounded-full bg-police-navy/60 items-center justify-center z-10"
            style={{ marginTop: insets.top + 52 }}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          </Pressable>

          {hasImage && (
            <Image
              source={{ uri: message.image }}
              className="w-full h-72"
              resizeMode="cover"
            />
          )}

          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingBottom: 32 }}
            showsVerticalScrollIndicator={false}
          >
            <View className="px-5 pt-6">
              <Text className="text-slate-900 text-2xl font-extrabold leading-8">
                {message.title}
              </Text>
            </View>

            <View className="px-5 pt-4 pb-10">
              <View className="flex-row items-center gap-2 mb-4 flex-wrap">
                <View
                  className={`px-2.5 py-1 rounded-full ${PRIORITY_META[message.priority].cls}`}
                >
                  <Text className="text-[10px] font-bold tracking-wider text-white">
                    {PRIORITY_META[message.priority].label}
                  </Text>
                </View>
                <Text className="text-slate-500 text-xs font-semibold">
                  {message.sentBy || 'Sri Lanka Police'}
                </Text>
                <Text className="text-slate-400 text-xs">
                  {formatDate(message.date, message.time)}
                </Text>
              </View>

              <Text className="text-slate-700 text-base leading-6">
                {message.content}
              </Text>

              {message.departments.length > 0 && (
                <View className="mt-6">
                  <Text className="text-slate-900 font-bold text-sm mb-2">
                    Delivered To
                  </Text>
                  {message.departments.map((d, index) => (
                    <View
                      key={`${d.departmentId}-${index}`}
                      className="bg-slate-50 rounded-lg px-3 py-2 mb-2"
                    >
                      <Text className="text-slate-600 text-xs font-semibold">
                        {d.departmentId}
                      </Text>
                      <Text className="text-slate-400 text-[11px]">
                        Status: {d.status}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>
        </>
      )}
    </View>
  );
}