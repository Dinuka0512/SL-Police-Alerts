import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type AlertLevel = 'high' | 'medium' | 'low';

type AlertItem = {
  id: string;
  level: AlertLevel;
  title: string;
  location: string;
  time: string;
};

const ALERTS: AlertItem[] = [
  {
    id: '1',
    level: 'high',
    title: 'Armed Robbery Reported',
    location: 'Main Street, Colombo 11',
    time: '10 min ago',
  },
  {
    id: '2',
    level: 'medium',
    title: 'Suspicious Activity',
    location: 'Kandy Road, Kadawatha',
    time: '35 min ago',
  },
  {
    id: '3',
    level: 'low',
    title: 'Traffic Diversion',
    location: 'Galle Road, Mount Lavinia',
    time: '1 hr ago',
  },
];

const LEVEL_META: Record<
  AlertLevel,
  { label: string; badge: string; dot: string }
> = {
  high: { label: 'HIGH', badge: 'bg-red-100', dot: 'bg-red-600' },
  medium: { label: 'MEDIUM', badge: 'bg-amber-100', dot: 'bg-amber-500' },
  low: { label: 'LOW', badge: 'bg-emerald-100', dot: 'bg-emerald-600' },
};

function AlertCard({ item }: { item: AlertItem }) {
  const meta = LEVEL_META[item.level];
  return (
    <View className="bg-white rounded-2xl border border-slate-200 p-4 mb-3">
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center gap-2">
          <View className={`h-2.5 w-2.5 rounded-full ${meta.dot}`} />
          <Text className="text-slate-900 font-semibold text-sm">{item.title}</Text>
        </View>
        <View className={`px-2.5 py-1 rounded-full ${meta.badge}`}>
          <Text className="text-[10px] font-bold tracking-wider text-slate-700">
            {meta.label}
          </Text>
        </View>
      </View>
      <Text className="text-slate-500 text-xs mb-1">{item.location}</Text>
      <Text className="text-slate-400 text-[11px]">{item.time}</Text>
    </View>
  );
}

export default function HomeScreen() {
  return (
    <View className="flex-1 bg-police-navy">
      <SafeAreaView edges={['top']} className="bg-police-navy">
        <View className="flex-row items-center gap-4 px-6 pt-4 pb-10">
          <View className="h-16 w-16 rounded-full bg-white items-center justify-center">
            <Image
              source={require('@/assets/images/police.png')}
              className="h-12 w-12"
              resizeMode="contain"
            />
          </View>
          <View className="flex-1">
            <Text className="text-white text-xl font-bold tracking-wide">
              SL Police Alert
            </Text>
            <Text className="text-blue-200 text-sm">
              Sri Lanka Police • Stay Safe
            </Text>
          </View>
        </View>
      </SafeAreaView>

      <View className="flex-1 bg-slate-100 rounded-t-3xl">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="px-4 -mt-6">
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
      </View>
    </View>
  );
}