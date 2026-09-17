import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  Text,
  View,
} from 'react-native';
import PagerView, {
  type PagerViewOnPageSelectedEvent,
} from 'react-native-pager-view';

import { newsService } from '@/services';
import type { HiruNews } from '@/types';

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

function formatNewsDate(value: string): string {
  const [datePart] = value.split(' ');
  const [year, month, day] = (datePart ?? '').split('-').map(Number);
  if (!year || !month || !day) return value;
  return `${day} ${MONTHS[month - 1]} ${year}`;``
}

function NewsPage({
  news,
  index,
  total,
}: {
  news: HiruNews;
  index: number;
  total: number;
}) {
  const open = async () => {
    if (!news.url) return;
    try {
      await WebBrowser.openBrowserAsync(news.url);
    } catch {
      // ignore browser failures
    }
  };

  return (
    <View style={{ width: '100%', height: '100%' }} collapsable={false}>
      <Pressable
        onPress={open}
        className="flex-1 overflow-hidden rounded-2xl"
        accessibilityRole="button"
        accessibilityLabel={`Open news ${news.title}`}
      >
        {news.image ? (
          <Image
            source={{ uri: news.image }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
        ) : (
          <View className="w-full h-full bg-police-navy" />
        )}

        <View className="absolute inset-0 bg-police-navy/75" />

        <View className="absolute inset-0 justify-end px-5 pb-6">
          <Text className="text-yellow-500 text-[11px] font-extrabold uppercase tracking-[3px] mb-1">
            Hiru News
          </Text>
          <Text className="text-2xl font-bold leading-8 text-white" numberOfLines={2}>
            {news.title}
          </Text>
          <Text className="mt-2 text-sm leading-5 text-white/90" numberOfLines={2}>
            {news.story}
          </Text>
          <View className="flex-row items-center mt-3">
            <Ionicons name="time-outline" size={13} color="#BFDBFE" />
            <Text className="text-blue-200 text-xs ml-1.5">
              {formatNewsDate(news.date)}
            </Text>
            <View className="flex-1" />
            <Text className="text-blue-200/80 text-[11px] font-semibold">
              {index + 1}/{total}
            </Text>
          </View>
        </View>
      </Pressable>
    </View>
  );
}

export function NewsSlider({ refreshKey = 0 }: { refreshKey?: number }) {
  const pagerHeight = 200;
  const pagerRef = useRef<React.ElementRef<typeof PagerView>>(null);
  const loadedRef = useRef(false);

  const [news, setNews] = useState<HiruNews[]>([]);
  const [active, setActive] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const empty = !loadedRef.current;
      try {
        const items = await newsService.getLatest(8, refreshKey > 0);
        if (!cancelled) {
          loadedRef.current = true;
          setNews(items);
          setActive(0);
          setError(null);
        }
      } catch (err) {
        if (!cancelled && empty) {
          setError(err instanceof Error ? err.message : 'Failed to load news');
        }
      } finally {
        if (!cancelled && empty) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  useEffect(() => {
    if (news.length <= 1) return;

    const id = setInterval(() => {
      const next = (active + 1) % news.length;
      pagerRef.current?.setPage(next);
      setActive(next);
    }, 5000);

    return () => clearInterval(id);
  }, [news.length, active]);

  const onPageSelected = (event: PagerViewOnPageSelectedEvent) => {
    setActive(event.nativeEvent.position);
  };

  return (
    <View className="px-4">
      <View className="flex-row items-center mb-3">
        <Ionicons name="newspaper-outline" size={18} color="#003366" />
        <Text className="ml-2 text-lg font-bold text-slate-900">Hiru News</Text>
        <Text className="ml-2 text-sm text-slate-400">Latest headlines</Text>
      </View>

      {isLoading ? (
        <View
          style={{ height: pagerHeight }}
          className="items-center justify-center bg-white border rounded-2xl border-slate-200"
        >
          <ActivityIndicator color="#1D4ED8" />
        </View>
      ) : error ? (
        <View
          style={{ height: pagerHeight }}
          className="items-center justify-center px-6 bg-white border rounded-2xl border-slate-200"
        >
          <Ionicons name="cloud-offline-outline" size={28} color="#94A3B8" />
          <Text className="mt-2 text-sm text-slate-400">Unable to load news</Text>
        </View>
      ) : news.length === 0 ? (
        <View
          style={{ height: pagerHeight }}
          className="items-center justify-center bg-white border rounded-2xl border-slate-200"
        >
          <Text className="text-sm text-slate-400">No news available.</Text>
        </View>
      ) : (
        <>
          <PagerView
            ref={pagerRef}
            style={{ height: pagerHeight }}
            initialPage={0}
            onPageSelected={onPageSelected}
          >
            {news.map((item, index) => (
              <NewsPage
                key={item.id}
                news={item}
                index={index}
                total={news.length}
              />
            ))}
          </PagerView>

          <View className="flex-row items-center justify-center mt-3">
            {news.map((item, index) => (
              <View
                key={item.id}
                className={
                  index === active
                    ? 'w-5 h-1.5 rounded-full bg-police-navy mx-0.5'
                    : 'w-1.5 h-1.5 rounded-full bg-slate-300 mx-0.5'
                }
              />
            ))}
          </View>
        </>
      )}
    </View>
  );
}