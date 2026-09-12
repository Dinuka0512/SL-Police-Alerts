import { Text, View } from 'react-native';

export type AlertLevel = 'high' | 'medium' | 'low';

export type AlertItem = {
  id: string;
  level: AlertLevel;
  title: string;
  location: string;
  time: string;
};

export const ALERTS: AlertItem[] = [
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

export function AlertCard({ item }: { item: AlertItem }) {
  const meta = LEVEL_META[item.level];
  return (
    <View className="bg-white rounded-2xl border border-slate-200 p-4 mb-3">
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-1 flex-row items-center gap-2">
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