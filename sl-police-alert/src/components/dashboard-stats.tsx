import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';

import { contactService, penaltyService } from '@/services';
import type { Penalty } from '@/types';

type StatItem = {
  key: string;
  label: string;
  value: number;
  loading: boolean;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconBg: string;
  iconColor: string;
  valueColor: string;
};

export function DashboardStats({
  alertCount,
  refreshKey = 0,
}: {
  alertCount: number;
  refreshKey?: number;
}) {
  const [penalties, setPenalties] = useState<Penalty[]>([]);
  const [contactsCount, setContactsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const loadedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const empty = !loadedRef.current;
      try {
        const [pens, contacts] = await Promise.all([
          penaltyService.findAll(),
          contactService.findAll(),
        ]);
        if (!cancelled) {
          loadedRef.current = true;
          setPenalties(pens);
          setContactsCount(contacts.length);
        }
      } finally {
        if (!cancelled && empty) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const paid = penalties.filter(
    penalty => penalty.status === 'Paid',
  ).length;
  const notPaid = penalties.filter(
    penalty => penalty.status === 'Not paid',
  ).length;

  const stats: StatItem[] = [
    {
      key: 'alerts',
      label: 'New Alerts',
      value: alertCount,
      loading: false,
      icon: 'notifications-outline',
      iconBg: 'bg-police-navy',
      iconColor: '#FFFFFF',
      valueColor: 'text-slate-900',
    },
    {
      key: 'paid',
      label: 'Penalties Paid',
      value: paid,
      loading: isLoading,
      icon: 'checkmark-circle-outline',
      iconBg: 'bg-emerald-100',
      iconColor: '#059669',
      valueColor: 'text-emerald-600',
    },
    {
      key: 'notpaid',
      label: 'Penalties Not Paid',
      value: notPaid,
      loading: isLoading,
      icon: 'close-circle-outline',
      iconBg: 'bg-red-100',
      iconColor: '#DC2626',
      valueColor: 'text-red-600',
    },
    {
      key: 'contacts',
      label: 'Emergency Contacts',
      value: contactsCount,
      loading: isLoading,
      icon: 'medkit-outline',
      iconBg: 'bg-blue-100',
      iconColor: '#1D4ED8',
      valueColor: 'text-slate-900',
    },
  ];

  return (
    <View className="flex-row flex-wrap -mx-1.5">
      {stats.map(stat => (
        <View key={stat.key} className="w-1/2 px-1.5 mb-3">
          <View className="bg-white rounded-2xl border border-slate-200 p-4 flex-row items-center">
            <View
              className={`h-11 w-11 rounded-full items-center justify-center ${stat.iconBg}`}
            >
              <Ionicons name={stat.icon} size={20} color={stat.iconColor} />
            </View>
            <View className="ml-3 flex-1">
              <Text
                className={`text-2xl font-extrabold leading-7 ${stat.valueColor}`}
                numberOfLines={1}
              >
                {stat.loading ? '…' : stat.value}
              </Text>
              <Text
                className="text-[11px] text-slate-500 font-semibold mt-0.5"
                numberOfLines={1}
              >
                {stat.label}
              </Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}