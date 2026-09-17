import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { ScreenHeader } from '@/components/screen-header';
import { TabBar } from '@/components/tab-bar';
import { timeAgo, truncateWords } from '@/lib/format';
import { messageService } from '@/services';
import { useAuth } from '@/store/auth';
import type { Message } from '@/types';

type MessageItem = {
  id: string;
  title: string;
  body: string;
  station: string;
  time: string;
  image: string;
};

function toMessage(message: Message): MessageItem {
  return {
    id: message.id,
    title: message.title,
    body: message.content,
    station: message.sentBy || 'Sri Lanka Police',
    time: timeAgo(message.date, message.time),
    image: message.image,
  };
}

export default function MessagesScreen() {
  const router = useRouter();
  const { token } = useAuth();

  const [messages, setMessages] = useState<MessageItem[]>([]);
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
        const data = await messageService.findAll();
        if (!cancelled) setMessages(data.map(toMessage));
      } catch (err) {
        if (err instanceof Error && err.message === 'Invalid or expired token') {
          router.replace('/login');
          return;
        }
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load messages');
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
        title="Distributed Messages"
        subtitle="Official broadcasts from police divisions"
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 24, paddingTop: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-4">
          {isLoading && <ActivityIndicator className="py-8" color="#1D4ED8" />}
          {!isLoading && error && (
            <Text className="text-red-600 text-sm text-center py-8">{error}</Text>
          )}
          {!isLoading && !error && messages.length === 0 && (
            <Text className="text-slate-400 text-sm text-center py-8">
              No messages yet.
            </Text>
          )}
          {messages.map(message => (
            <Pressable
              key={message.id}
              onPress={() =>
                router.push({
                  pathname: '/message/[id]',
                  params: { id: message.id },
                })
              }
              className="bg-white rounded-2xl border border-slate-200 p-3 mb-3 flex-row"
              accessibilityRole="button"
              accessibilityLabel={`Open message ${message.title}`}
            >
              <View className="w-20 h-20 rounded-xl bg-slate-100 overflow-hidden items-center justify-center">
                {message.image ? (
                  <Image
                    source={{ uri: message.image }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                ) : (
                  <Ionicons name="megaphone-outline" size={24} color="#94A3B8" />
                )}
              </View>
              <View className="flex-1 ml-3">
                <Text
                  className="text-slate-900 font-bold text-sm leading-5"
                  numberOfLines={1}
                >
                  {truncateWords(message.title, 3)}
                </Text>
                <Text
                  className="text-slate-500 text-xs leading-4 mt-1"
                  numberOfLines={3}
                >
                  {message.body}
                </Text>
                <View className="flex-row items-center justify-between mt-2">
                  <Text
                    className="text-police-primary text-[11px] font-semibold flex-1 mr-2"
                    numberOfLines={1}
                  >
                    {message.station}
                  </Text>
                  <Text className="text-slate-400 text-[10px]">{message.time}</Text>
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <TabBar active="messages" />
    </View>
  );
}