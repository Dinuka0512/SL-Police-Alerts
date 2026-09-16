import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';

import { ScreenHeader } from '@/components/screen-header';
import { TabBar } from '@/components/tab-bar';
import { timeAgo } from '@/lib/format';
import { messageService } from '@/services';
import { useAuth } from '@/store/auth';
import type { Message } from '@/types';

type MessageItem = {
  id: string;
  title: string;
  body: string;
  station: string;
  time: string;
};

function toMessage(message: Message): MessageItem {
  return {
    id: message.id,
    title: message.title,
    body: message.content,
    station: message.sentBy || 'Sri Lanka Police',
    time: timeAgo(message.date, message.time),
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
            <View
              key={message.id}
              className="bg-white rounded-2xl border border-slate-200 p-4 mb-3"
            >
              <Text className="text-slate-900 font-bold text-base mb-1">
                {message.title}
              </Text>
              <Text className="text-slate-500 text-sm leading-5">
                {message.body}
              </Text>
              <View className="flex-row items-center justify-between mt-3">
                <Text className="text-police-primary text-xs font-semibold">
                  {message.station}
                </Text>
                <Text className="text-slate-400 text-[11px]">{message.time}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <TabBar active="messages" />
    </View>
  );
}